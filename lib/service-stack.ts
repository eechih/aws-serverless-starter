import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { AppsyncConstruct } from './appsync-construct'
import { CognitoConstruct } from './cognito-construct'
import { IamConstruct } from './iam-construct'
import { Route53Construct } from './route53-construct'
import { S3Construct } from './s3-construct'

export interface ServiceStackProps extends StackProps {
  stageName: string
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props)

    const { stageName } = props

    const s3 = new S3Construct(this, 's3', { stageName })

    const cognito = new CognitoConstruct(this, 'cognito', { stageName })

    const iam = new IamConstruct(this, 'iam', {
      stageName,
      bucket: s3.bucket,
      identityPool: cognito.identityPool,
    })

    const route53 = new Route53Construct(this, 'route53', {
      stageName,
    })

    const appsync = new AppsyncConstruct(this, 'appsync', {
      stageName,
      ...route53,
    })

    cognito.attachRolesToIdentityPool(iam.authRole, iam.unauthRole)
  }
}
