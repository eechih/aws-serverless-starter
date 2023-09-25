import serverlessExpress from '@vendia/serverless-express'
import { Handler } from 'aws-lambda'
import { app } from './app'

export const handler = serverlessExpress({ app }) as Handler
