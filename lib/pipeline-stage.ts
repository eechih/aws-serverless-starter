import { Stage, StageProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import config from '../app.config'
import { AwsServerlessStarterStack } from './aws-serverless-starter-stack'

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props)

    const stackName = config.appName + '-' + this.stageName

    const service = new AwsServerlessStarterStack(this, 'Service', {
      stackName,
    })
  }
}
