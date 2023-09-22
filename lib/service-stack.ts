import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { CognitoConstruct } from './cognito-construct'
import { IamConstruct } from './iam-construct'
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

    cognito.attachRolesToIdentityPool(iam.authRole, iam.unauthRole)
  }
}
