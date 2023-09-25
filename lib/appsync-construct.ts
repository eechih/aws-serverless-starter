import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { join } from 'path'

import config from './config'

export interface AppsyncConstructProps {
  stageName: string
  publicHostedZone?: route53.IHostedZone
  apiDomainName?: string
  apiCertificate?: certificatemanager.ICertificate
}

export class AppsyncConstruct extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi
  public readonly graphqlEndpoint: string

  constructor(scope: Construct, id: string, props: AppsyncConstructProps) {
    super(scope, id)
    const { stageName, publicHostedZone, apiDomainName, apiCertificate } = props

    this.graphqlApi = new appsync.GraphqlApi(this, 'GraphqlApi', {
      name: `${config.appName}-${stageName}-graphqlapi`,
      schema: appsync.SchemaFile.fromAsset(
        join(__dirname, '..', 'graphql', 'schema.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
      logConfig: {
        excludeVerboseContent: true,
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    })

    this.graphqlEndpoint = this.graphqlApi.graphqlUrl

    if (publicHostedZone && apiDomainName && apiCertificate) {
      const cfnDomainName = new appsync.CfnDomainName(this, 'CfnDomainName', {
        domainName: apiDomainName,
        certificateArn: apiCertificate.certificateArn,
      })

      new appsync.CfnDomainNameApiAssociation(
        this,
        'CfnDomainNameApiAssociation',
        {
          apiId: this.graphqlApi.apiId,
          domainName: cfnDomainName.attrDomainName,
        }
      )

      // Extract domain name from graphqlUrl.
      // e.g. https://upn2bg4qaveq.appsync-api.us-east-1.amazonaws.com/graphql => upn2bg4qaveq.appsync-api.us-east-1.amazonaws.com
      const graphqlUrlDomainName = cdk.Fn.select(
        2,
        cdk.Fn.split('/', this.graphqlApi.graphqlUrl)
      )

      new route53.CnameRecord(this, 'CnameRecord', {
        domainName: graphqlUrlDomainName,
        zone: publicHostedZone,
        recordName: apiDomainName,
      })

      this.graphqlEndpoint = `https://${apiDomainName}/graphql`
    }
  }
}
