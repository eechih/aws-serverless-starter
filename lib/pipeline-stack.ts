import * as cdk from 'aws-cdk-lib'
import { join } from 'path'

import * as codeBuild from 'aws-cdk-lib/aws-codebuild'
import * as codePipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codePipelineActions from 'aws-cdk-lib/aws-codepipeline-actions'
import * as codeStarConnections from 'aws-cdk-lib/aws-codestarconnections'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'

import config from '../app.config'

export interface Stage {
  name: string
  pipelineExecutionRole: iam.IRole
  cloudFormationExecutionRole: iam.IRole
  artifactsBucket: s3.IBucket
}

export interface PipelineStackProps extends cdk.StackProps {
  stages: Stage[]
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: PipelineStackProps) {
    super(scope, id, props)
    const { stages } = props

    const codeBuildEnvironment = {
      computeType: codeBuild.ComputeType.LARGE,
      buildImage: codeBuild.LinuxBuildImage.STANDARD_7_0,
    }

    const pipelineArtifactsBucket = new s3.Bucket(
      this,
      'PipelineArtifactsBucket',
      {
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    )

    const pipeline = new codePipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${config.appName}-pipeline`,
      artifactBucket: pipelineArtifactsBucket,
      restartExecutionOnUpdate: true, // Allow the pipeline to restart if it mutates during CDK deploy
    })

    const gitHubConnection = new codeStarConnections.CfnConnection(
      this,
      'CodeStarConnection',
      {
        connectionName: 'GitRepositoryConnection',
        providerType: 'GitHub',
      }
    )

    const sourceOutput = new codePipeline.Artifact('SourceOutput')
    const sourceAction =
      new codePipelineActions.CodeStarConnectionsSourceAction({
        actionName: 'Source',
        owner: config.sourceRepoOwner,
        repo: config.sourceRepoName,
        branch: config.sourceBranch,
        output: sourceOutput,
        connectionArn: gitHubConnection.ref,
      })

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    })

    const unitTestProject = new codeBuild.PipelineProject(
      this,
      'CodeBuildProjectUnitTest',
      {
        buildSpec: codeBuild.BuildSpec.fromAsset(
          join(__dirname, '..', 'pipeline', 'buildspec_unit_test.yml')
        ),
        environment: codeBuildEnvironment,
        environmentVariables: {
          HUSKY: {
            type: codeBuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: 0,
          },
        },
      }
    )

    const unitTestOutput = new codePipeline.Artifact()
    pipeline.addStage({
      stageName: 'UnitTests',
      actions: [
        new codePipelineActions.CodeBuildAction({
          actionName: 'UnitTests',
          project: unitTestProject,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    })
  }
}
