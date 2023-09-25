import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { join } from 'path'

export interface ConfigurationProps {
  bucket: s3.IBucket
  httpApi: apigwv2.HttpApi
}

export default class Configuration extends Construct {
  public readonly lambdaFunction: lambda.IFunction

  constructor(scope: Construct, id: string, props: ConfigurationProps) {
    super(scope, id)
    const { httpApi } = props

    const lambdaDir = join(__dirname, '..', 'packages', 'configuration')

    const lambdaFunction = new NodejsFunction(this, 'lambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: join(lambdaDir, 'src', 'index.ts'),
      depsLockFilePath: join(lambdaDir, 'package-lock.json'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
      },
    })

    // 👇 grant some permissions for the lambda role
    props.bucket.grantRead(lambdaFunction)

    this.lambdaFunction = lambdaFunction

    const lamblaIntegration = new HttpLambdaIntegration(
      'lambdaIntegration',
      lambdaFunction
    )

    httpApi.addRoutes({
      path: '/configurations',
      methods: [
        apigwv2.HttpMethod.OPTIONS,
        apigwv2.HttpMethod.GET,
        apigwv2.HttpMethod.POST,
        apigwv2.HttpMethod.PUT,
        apigwv2.HttpMethod.PATCH,
        apigwv2.HttpMethod.DELETE,
      ],
      integration: lamblaIntegration,
    })

    httpApi.addRoutes({
      path: '/configurations/{proxy+}',
      methods: [
        apigwv2.HttpMethod.OPTIONS,
        apigwv2.HttpMethod.GET,
        apigwv2.HttpMethod.POST,
        apigwv2.HttpMethod.PUT,
        apigwv2.HttpMethod.PATCH,
        apigwv2.HttpMethod.DELETE,
      ],
      integration: lamblaIntegration,
    })
  }
}
