import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export interface S3ConstructProps {
  stageName: string
}

export class S3Construct extends Construct {
  public readonly bucket: s3.IBucket

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id)

    const { stageName } = props

    this.bucket = new s3.Bucket(this, 'Bucket', {
      versioned: true,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'],
          exposedHeaders: [
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
            'ETag',
          ],
          maxAge: 3000,
        },
      ],
      removalPolicy: (() => {
        switch (stageName) {
          case 'dev':
            return cdk.RemovalPolicy.DESTROY
          default:
            return cdk.RemovalPolicy.RETAIN
        }
      })(),
    })
  }
}
