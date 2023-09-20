import { Stage, StageProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { AwsServerlessStarterStack } from './aws-serverless-starter-stack'

export class DeoployStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props)

    const service = new AwsServerlessStarterStack(this, this.stageName)
  }
}
