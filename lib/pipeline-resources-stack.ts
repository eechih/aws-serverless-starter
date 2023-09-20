import * as cdk from 'aws-cdk-lib'

import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'

interface PipelineResourcesStackProps extends cdk.StackProps {
  stageName: string
  pipelineExecutionRoleArn?: string
  cloudFormationExecutionRoleArn?: string
  artifactBucketArn?: string
}

export class PipelineResourcesStack extends cdk.Stack {
  readonly pipelineExecutionRole: iam.IRole
  readonly cloudFormationExecutionRole: iam.IRole
  readonly artifactsBucket: s3.IBucket

  constructor(scope: cdk.App, id: string, props: PipelineResourcesStackProps) {
    super(scope, id, props)
    const {
      stageName,
      pipelineExecutionRoleArn,
      cloudFormationExecutionRoleArn,
      artifactBucketArn,
    } = props

    const trustPrincipals: iam.PrincipalBase[] = []

    if (stageName.startsWith('dev') || stageName.endsWith('dev')) {
      // Allow users in devs account to assume the deployment role to deploy manually
      // with fast `sls deploy`, for example. Should not be enabled for other targets where
      // deployment should always be automated.
      trustPrincipals.push(new iam.AccountPrincipal(this.account))
    }

    const deployAccount =
      this.node.tryGetContext('deploy-account') || this.account
    if (deployAccount) {
      trustPrincipals.push(new iam.AccountPrincipal(deployAccount))
    }

    if (artifactBucketArn) {
      this.artifactsBucket = s3.Bucket.fromBucketArn(
        this,
        'ArtifactsBucket',
        artifactBucketArn
      )
    } else {
      this.artifactsBucket = new s3.Bucket(this, `ArtifactsBucket`, {
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        versioned: true,
      })
    }

    if (cloudFormationExecutionRoleArn) {
      this.cloudFormationExecutionRole = iam.Role.fromRoleArn(
        this,
        'CloudFormationExecutionRole',
        cloudFormationExecutionRoleArn
      )
    } else {
      this.cloudFormationExecutionRole = new iam.Role(
        this,
        'CloudFormationExecutionRole',
        {
          roleName: `${stageName}-CloudFormationExecutionRole`,
          assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
        }
      )

      this.cloudFormationExecutionRole.attachInlinePolicy(
        new iam.Policy(this, 'GrantCloudFormationFullAccess', {
          policyName: 'GrantCloudFormationFullAccess',
          statements: [
            new iam.PolicyStatement({
              actions: ['*'],
              resources: ['*'],
              effect: iam.Effect.ALLOW,
            }),
          ],
        })
      )
    }

    if (pipelineExecutionRoleArn) {
      this.pipelineExecutionRole = iam.Role.fromRoleArn(
        this,
        'PipelineExecutionRole',
        pipelineExecutionRoleArn
      )
    } else {
      this.pipelineExecutionRole = new iam.Role(this, 'PipelineExecutionRole', {
        roleName: `${stageName}-PipelineExecutionRole`,
        assumedBy: new iam.CompositePrincipal(...trustPrincipals),
      })

      this.pipelineExecutionRole.attachInlinePolicy(
        new iam.Policy(this, 'PipelineExecutionRolePermissions', {
          policyName: 'PipelineExecutionRolePermissions',
          statements: [
            new iam.PolicyStatement({
              actions: ['iam:PassRole'],
              resources: [this.cloudFormationExecutionRole.roleArn],
              effect: iam.Effect.ALLOW,
            }),
            new iam.PolicyStatement({
              actions: [
                'cloudformation:CreateChangeSet',
                'cloudformation:DescribeChangeSet',
                'cloudformation:ExecuteChangeSet',
                'cloudformation:DeleteStack',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DescribeStacks',
                'cloudformation:GetTemplate',
                'cloudformation:GetTemplateSummary',
                'cloudformation:DescribeStackResource',
              ],
              resources: ['*'],
              effect: iam.Effect.ALLOW,
            }),
            new iam.PolicyStatement({
              actions: [
                's3:DeleteObject',
                's3:GetObject*',
                's3:PutObject*',
                's3:GetBucket*',
                's3:List*',
              ],
              resources: [
                this.artifactsBucket.bucketArn + '/',
                this.artifactsBucket.bucketArn + '/*',
              ],
              effect: iam.Effect.ALLOW,
            }),
          ],
        })
      )
    }

    new cdk.CfnOutput(this, 'ArtifactsBucketArn', {
      value: this.artifactsBucket.bucketArn,
      description: 'ARN of the Artifact bucket',
    })

    new cdk.CfnOutput(this, 'PipelineExecutionRoleArn', {
      value: this.pipelineExecutionRole.roleArn,
      description: 'ARN of the IAM Role(PipelineExecutionRole)',
    })

    new cdk.CfnOutput(this, 'CloudFormationExecutionRoleArn', {
      value: this.cloudFormationExecutionRole.roleArn,
      description: 'ARN of the IAM Role(CloudFormationExecutionRole)',
    })
  }
}
