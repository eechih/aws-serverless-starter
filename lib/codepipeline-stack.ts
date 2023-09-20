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

    const unitTestStage = pipeline.addStage(new cdk.Stage(this, 'UnitTest'))
    unitTestStage.addPost(
      new CodeBuildStep('UnitTest', {
        projectName: 'UnitTest',
        commands: ['npm ci', 'npm run test'],
      })
    )

    const deployTestStage = pipeline.addStage(
      new DeoployStage(this, 'DeployTest', {
        stackName: `${config.appName}-test`,
      })
    )

    const deployProdStage = pipeline.addStage(
      new DeoployStage(this, 'DeployProd', {
        stackName: `${config.appName}-prod`,
      })
    )

    deployProdStage.addPre(new ManualApprovalStep('ManualApproval'))
  }
}
