#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import config from '../app.config'
import { AwsServerlessStarterStack } from '../lib/aws-serverless-starter-stack'
import { PipelineResourcesStack } from '../lib/pipeline-resources-stack'
import { PipelineStack, Stage } from '../lib/pipeline-stack'

const app = new cdk.App()
const stagesInput = app.node.tryGetContext('stages')
if (!stagesInput) {
  throw new Error(
    'Stages need to be specified in CDK context. ' +
      'Pass -c stages=dev or -c stages=stg,prod to cdk deploy. ' +
      'CDK context variables can also be passed in cdk.json. ' +
      'See https://docs.aws.amazon.com/cdk/latest/guide/get_context_var.html'
  )
}
const stageNames = stagesInput.split(',')

const stages: Stage[] = []

for (const stageName of stageNames) {
  const {
    pipelineExecutionRole,
    cloudFormationExecutionRole,
    artifactsBucket,
  } = new PipelineResourcesStack(
    app,
    `island-managed-${stageName}-pipeline-resources`,
    {
      // stackName: `island-managed-${stageName}-pipeline-resources`,
      env: {
        account: app.node.tryGetContext(`${stageName}-account`) || app.region,
        region: app.node.tryGetContext(`${stageName}-region`) || app.region,
      },
      stageName,
    }
  )
  stages.push({
    name: stageName,
    pipelineExecutionRole,
    cloudFormationExecutionRole,
    artifactsBucket,
  })
}

new PipelineStack(app, `${config.appName}-pipeline`, {
  stackName: `${config.appName}-pipeline`,
  env: {
    account: app.node.tryGetContext('deploy-account') || app.region,
    region: app.node.tryGetContext('deploy-region') || app.region,
  },
  stages,
})

new AwsServerlessStarterStack(app, 'AwsServerlessStarterStack')
