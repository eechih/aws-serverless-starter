import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express, { Express, Request, Response } from 'express'

import S3Client from './Client'

export const bucket = new S3Client({
  region: process.env.AWS_REGION!,
  bucketName: process.env.BUCKET_NAME!,
})

const app: Express = express()
app.use(bodyParser.json())

const router = express.Router()
router.use(compression())
router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.get('/configurations/:version', async (req: Request, res: Response) => {
  const { version } = req.params
  const prefix = `configurations/${version}/`
  const objects = await bucket.listObjects({ prefix })
  const resources = await Promise.all(
    objects
      .filter(({ size = 0 }) => size > 0)
      .map(async object => {
        const { key } = object
        const url = key ? await bucket.getPresignedUrl({ key }) : undefined
        return { ...object, url }
      })
  )
  return res.json({
    version,
    resources,
  })
})

app.use('/', router)
export { app }
