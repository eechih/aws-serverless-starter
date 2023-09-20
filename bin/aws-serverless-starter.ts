#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import config from '../app.config'
import { PipelineStack } from '../lib/codepipeline-stack'

const app = new cdk.App()
new PipelineStack(app, `${config.appName}-pipeline`, {
  env: {
    account: app.node.tryGetContext('deploy-account') || app.region,
    region: app.node.tryGetContext('deploy-region') || app.region,
  },
})
