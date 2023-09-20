import { Stage, StageProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { AwsServerlessStarterStack } from './aws-serverless-starter-stack'

export interface DeployStageProps extends StageProps {
  stackName: string
}
export class DeoployStage extends Stage {
  constructor(scope: Construct, id: string, props: DeployStageProps) {
    super(scope, id, props)
    const { stackName } = props

    const service = new AwsServerlessStarterStack(scope, stackName)
  }
}
