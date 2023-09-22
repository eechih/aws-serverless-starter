#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'

import config from '../lib/config'
import { PipelineStack } from '../lib/pipeline-stack'

const app = new cdk.App()

new PipelineStack(app, `${config.appName}-pipeline`, {
  env: {
    account: config.deployAccount,
    region: config.deployRegion,
  },
})
