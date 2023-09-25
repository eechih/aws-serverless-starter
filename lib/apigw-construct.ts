import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import { Construct } from 'constructs'

import config from './config'

export interface ApigwConstructProps {
  stageName: string
}

export class ApigwConstruct extends Construct {
  public readonly httpApi: apigwv2.HttpApi

  constructor(scope: Construct, id: string, props: ApigwConstructProps) {
    super(scope, id)
    const { stageName } = props

    this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: `${config.appName}-${stageName}-httpapi`,
      corsPreflight: {
        allowOrigins: ['http://localhost:3000'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.OPTIONS,
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
        ],
        allowCredentials: true,
      },
    })
  }
}
