import { Stage, StageProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import config from './config'
import { ServiceStack } from './service-stack'

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props)
    new ServiceStack(this, 'services', {
      stackName: `${config.appName}-${this.stageName}`,
      stageName: this.stageName,
      env: {
        account: config.deployAccount,
        region: config.deployRegion,
      },
    })
  }
}
