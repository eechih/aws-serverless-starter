import * as cdk from 'aws-cdk-lib'

import * as codeBuild from 'aws-cdk-lib/aws-codebuild'
import * as codePipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codePipelineActions from 'aws-cdk-lib/aws-codepipeline-actions'
import * as codeStarConnections from 'aws-cdk-lib/aws-codestarconnections'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'

import config from '../app.config'

export interface Stage {
  stageName: string
  pipelineExecutionRole: iam.IRole
  cloudFormationExecutionRole: iam.IRole
  artifactsBucket: s3.IBucket
  approvalEnabled?: boolean
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
        buildSpec: codeBuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: 18,
              },
            },
            pre_build: {
              commands: ['echo Installing dependencies', 'npm install'],
            },
            build: { commands: ['echo Running unit tests', 'npm run test'] },
          },
          artifacts: {
            files: '**/*',
            'enable-symlinks': true,
          },
        }),
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

    stages.forEach((stage, stageIndex) => {
      const { stageName, approvalEnabled } = stage
      const targetRegion =
        this.node.tryGetContext(`${stageName}-region`) || this.region

      if (approvalEnabled) {
        pipeline.addStage({
          stageName: `${stageName}Approve`,
          actions: [
            new codePipelineActions.ManualApprovalAction({
              actionName: `${stageName}Approve`,
              // notificationTopic: topic
            }),
          ],
        })
      }

      const deployProject = new codeBuild.PipelineProject(
        this,
        `${config.appName}_${stageName}_deploy`,
        {
          projectName: `${config.appName}-${stageName}-deploy`,
          buildSpec: codeBuild.BuildSpec.fromObject({
            version: '0.2',
            phases: {
              install: {
                'runtime-versions': {
                  nodejs: 18,
                },
                commands: ['npm install -g aws-cdk', 'cdk --version'],
              },
              pre_build: {
                commands: [
                  'bash ./assume-role.sh ${ENV_PIPELINE_EXECUTION_ROLE} deploy',
                ],
              },
              build: {
                commands: [`cdk deploy ${config.appName}-${stageName}`],
              },
            },
          }),
          environment: codeBuildEnvironment,
          environmentVariables: {
            ENV_PIPELINE_EXECUTION_ROLE: {
              type: codeBuild.BuildEnvironmentVariableType.PLAINTEXT,
              value: stage.pipelineExecutionRole.roleArn,
            },
          },
        }
      )

      deployProject.role?.addToPrincipalPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: [stage.cloudFormationExecutionRole.roleArn],
        })
      )

      pipeline.addStage({
        stageName: `${stageName}Deploy`,
        actions: [
          new codePipelineActions.CodeBuildAction({
            actionName: `${stageName}_deploy`,
            project: deployProject,
            input: unitTestOutput,
          }),
        ],
      })
    })
  }
}
