import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'

import { UserService } from './user-service'

export interface ServiceStackProps extends StackProps {
  /**
   * @default local
   */
  stageName?: string
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: ServiceStackProps) {
    super(scope, id, props)

    const { stageName = 'local' } = props || {}

    const { userPool } = new UserService(this, 'user-service', { stageName })

    const queue = new sqs.Queue(this, 'AwsServerlessStarterQueue', {
      visibilityTimeout: Duration.seconds(300),
    })

    const topic = new sns.Topic(this, 'AwsServerlessStarterTopic')

    topic.addSubscription(new subs.SqsSubscription(queue))
  }
}
