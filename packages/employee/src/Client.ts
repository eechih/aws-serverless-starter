import {
  S3Client as AWSS3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  _Object,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type ClientConfig = {
  region: string
  bucketName: string
}

export type Object = {
  key?: string
  lastModified?: Date
  eTag?: string
  size?: number
  owner?: {
    displayName?: string
    id?: string
  }
}

const convert = (o: _Object): Object => {
  return {
    key: o.Key,
    size: o.Size,
    lastModified: o.LastModified,
  }
}

export default class Client {
  private client: AWSS3Client
  private bucketName: string

  constructor(config: ClientConfig) {
    const { region, bucketName } = config
    if (!region || !bucketName) {
      throw new Error(
        `Invalid S3ClientConfig ${JSON.stringify(config, null, 2)}`
      )
    }
    this.bucketName = bucketName
    this.client = new AWSS3Client({ region })
  }

  async listObjects(params: {
    prefix?: string
    maxKeys?: number
  }): Promise<Object[]> {
    const objects: Object[] = []
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: params.prefix,
      MaxKeys: params.maxKeys,
    })
    let isTruncated = true
    while (isTruncated) {
      const output = await this.client.send(command)
      isTruncated = output.IsTruncated ?? false
      command.input.ContinuationToken = output.NextContinuationToken
      output.Contents?.forEach(o => objects.push(convert(o)))
    }
    return objects
  }

  async getObject(params: { key: string }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
    })
    const result = await this.client.send(command)
    return result.Body?.transformToString() ?? ''
  }

  async putObject(params: { key: string; body: string }) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
      Body: params.body,
    })
    await this.client.send(command)
  }

  async getPresignedUrl(params: {
    key: string
    /**
     * The number of seconds before the presigned URL expires
     */
    expiresIn?: number
  }): Promise<string> {
    const { key, expiresIn = 60 } = params
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    return getSignedUrl(this.client, command, { expiresIn })
  }
}
