import * as cdk from 'aws-cdk-lib'

import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
} from 'aws-cdk-lib/pipelines'

import config from './config'
import { PipelineStage } from './pipeline-stage'

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.gitHub(config.gitRepo, config.gitBranch, {
          authentication: cdk.SecretValue.secretsManager('github-token'),
        }),
        installCommands: ['npm install -g aws-cdk@2'],
        commands: ['npm ci', 'npm run build', 'cdk synth'],
      }),
    })

    // Deploy to development environment.
    pipeline.addStage(
      new PipelineStage(this, 'DeployDev', { stageName: 'dev' }),
      {
        pre: [
          new CodeBuildStep('UnitTest', {
            commands: ['npm ci', 'npm run test'],
          }),
        ],
      }
    )

    // Deploy to staging environment.
    pipeline.addStage(
      new PipelineStage(this, 'DeployStg', { stageName: 'stg' }),
      {
        pre: [new ManualApprovalStep('ManualApproval')],
        post: [
          new CodeBuildStep('IntegrationTest', {
            commands: ['echo Run integration test'],
          }),
        ],
      }
    )

    // Deploy to production environment.
    pipeline.addStage(
      new PipelineStage(this, 'DeployProd', { stageName: 'prod' }),
      {
        pre: [new ManualApprovalStep('ManualApproval')],
        post: [
          new CodeBuildStep('TestAPIGatewayEndpoint', {
            commands: ['echo Test API Gateway Endpoint'],
          }),
        ],
      }
    )
  }
}
