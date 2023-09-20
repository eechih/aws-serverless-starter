import * as cdk from 'aws-cdk-lib'

import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
} from 'aws-cdk-lib/pipelines'

import config from '../app.config'
import { DeoployStage } from './deploy-stage'

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.gitHub(
          `${config.sourceRepoOwner}/${config.sourceRepoName}`,
          config.sourceBranch
        ),
        installCommands: ['npm install -g aws-cdk@2'],
        commands: ['npm ci', 'npm run build', 'cdk synth'],
      }),
    })

    const deployDevStage = pipeline.addStage(new DeoployStage(this, 'Dev'), {
      pre: [
        new CodeBuildStep('UnitTest', {
          commands: ['npm ci', 'npm run test'],
        }),
      ],
    })

    const deployTestStage = pipeline.addStage(new DeoployStage(this, 'Test'), {
      pre: [new ManualApprovalStep('ManualApproval')],
      post: [
        new CodeBuildStep('IntegrationTest', {
          commands: ['echo Run integration test'],
        }),
      ],
    })

    const deployProdStage = pipeline.addStage(new DeoployStage(this, 'Prod'), {
      pre: [new ManualApprovalStep('ManualApproval')],
      post: [
        new CodeBuildStep('TestAPIGatewayEndpoint', {
          commands: ['echo Test API Gateway Endpoint'],
        }),
      ],
    })
  }
}
