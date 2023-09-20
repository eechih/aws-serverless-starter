import * as cdk from 'aws-cdk-lib'

import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from 'aws-cdk-lib/pipelines'

import config from '../app.config'
import { DeoployStage } from './deploy-stage'

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const pipeline = new CodePipeline(this, 'Pipeline', {
      // pipelineName: `${config.appName}-pipeline`,
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.gitHub(
          `${config.sourceRepoOwner}/${config.sourceRepoName}`,
          config.sourceBranch
        ),
        installCommands: ['npm install -g aws-cdk@2'],
        commands: ['npm ci', 'npm run build', 'cdk synth'],
      }),
    })

    const deployStage = pipeline.addStage(
      new DeoployStage(this, 'Deploy', { stageName: 'dev' })
    )
  }
}
