import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { ServiceStack } from '../lib/service-stack'

import config from '../lib/config'

test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App()
  // WHEN
  const stack = new ServiceStack(app, 'MyTestStack', {
    stageName: 'test',
    env: {
      account: config.deployAccount,
      region: config.deployRegion,
    },
  })
  // THEN

  const template = Template.fromStack(stack)

  // template.hasResourceProperties('AWS::SQS::Queue', {
  //   VisibilityTimeout: 300,
  // })
  // template.resourceCountIs('AWS::SNS::Topic', 1)
})
