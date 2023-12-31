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
    const { gitRepo, gitBranch } = config.sourceConfig

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.gitHub(gitRepo, gitBranch, {
          authentication: cdk.SecretValue.secretsManager('github-token'),
        }),
        installCommands: ['npm install -g aws-cdk@2'],
        commands: ['npm ci', 'npm run build', 'cdk synth'],
      }),
    })

    const wave = pipeline.addWave('wave', {
      pre: [
        new CodeBuildStep('UnitTest', {
          commands: ['npm ci', 'npm run test'],
        }),
      ],
    })

    // Deploy to development environment.
    wave.addStage(new PipelineStage(this, 'dev', { stageName: 'dev' }))

    // Deploy to testing environment.
    wave.addStage(new PipelineStage(this, 'test', { stageName: 'test' }))

    // Deploy to staging environment.
    pipeline.addStage(new PipelineStage(this, 'stg', { stageName: 'stg' }), {
      pre: [new ManualApprovalStep('ManualApproval')],
      post: [
        new CodeBuildStep('IntegrationTest', {
          commands: ['echo Run integration test'],
        }),
      ],
    })

    // Deploy to production environment.
    pipeline.addStage(new PipelineStage(this, 'prod', { stageName: 'prod' }), {
      pre: [new ManualApprovalStep('ManualApproval')],
      post: [
        new CodeBuildStep('TestAPIGatewayEndpoint', {
          commands: ['echo Test API Gateway Endpoint'],
        }),
      ],
    })
  }
}
