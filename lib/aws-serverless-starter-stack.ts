import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class AwsServerlessStarterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // const queue = new sqs.Queue(this, 'AwsServerlessStarterQueue', {
    //   visibilityTimeout: Duration.seconds(300),
    // })

    // const topic = new sns.Topic(this, 'AwsServerlessStarterTopic')

    // topic.addSubscription(new subs.SqsSubscription(queue))
  }
}
