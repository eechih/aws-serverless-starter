import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

import config from './config'

export interface IamConstructProps {
  stageName: string
  bucket: s3.IBucket
  identityPool: cognito.CfnIdentityPool
}

export class IamConstruct extends Construct {
  public readonly authRole: iam.IRole
  public readonly unauthRole: iam.IRole
  public readonly privatePolicy: iam.Policy
  public readonly protectedPolicy: iam.Policy
  public readonly publicPolicy: iam.Policy
  public readonly readPolicy: iam.Policy
  public readonly uploadPolicy: iam.Policy

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id)

    const { stageName, identityPool, bucket } = props

    this.authRole = new iam.Role(this, 'AuthRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    })

    this.unauthRole = new iam.Role(this, 'UnauthRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    })

    this.privatePolicy = new iam.Policy(this, 'PrivatePolicy', {
      policyName: `${config.appName}-${stageName}-private-policy`,
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
          resources: [
            bucket.arnForObjects(
              'private/${cognito-identity.amazonaws.com:sub}/*'
            ),
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    })

    this.protectedPolicy = new iam.Policy(this, 'ProtectedPolicy', {
      policyName: `${config.appName}-${stageName}-protected-policy`,
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
          resources: [
            bucket.arnForObjects(
              'protected/${cognito-identity.amazonaws.com:sub}/*'
            ),
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    })

    this.publicPolicy = new iam.Policy(this, 'PublicPolicy', {
      policyName: `${config.appName}-${stageName}-public-policy`,
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
          resources: [bucket.arnForObjects('public/*')],
          effect: iam.Effect.ALLOW,
        }),
        // new iam.PolicyStatement({
        //   actions: ['appsync:GraphQL'],
        //   resources: [`${graphqlApi.arn}/*`],
        //   effect: iam.Effect.ALLOW,
        // }),
      ],
    })

    this.readPolicy = new iam.Policy(this, 'ReadPolicy', {
      policyName: `${config.appName}-${stageName}-read-policy`,
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [bucket.arnForObjects('protected/*')],
          effect: iam.Effect.ALLOW,
        }),
        new iam.PolicyStatement({
          actions: ['s3:ListBucket'],
          resources: [bucket.bucketArn],
          effect: iam.Effect.ALLOW,
          conditions: {
            StringLike: {
              's3:prefix': [
                'public/',
                'public/*',
                'protected/',
                'protected/*',
                'private/${cognito-identity.amazonaws.com:sub}/',
                'private/${cognito-identity.amazonaws.com:sub}/*',
              ],
            },
          },
        }),
      ],
    })

    this.uploadPolicy = new iam.Policy(this, 'UploadPolicy', {
      policyName: `${config.appName}-${stageName}-upload-policy`,
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject'],
          resources: [bucket.arnForObjects('uploads/*')],
          effect: iam.Effect.ALLOW,
        }),
      ],
    })

    this.authRole.attachInlinePolicy(this.privatePolicy)
    this.authRole.attachInlinePolicy(this.protectedPolicy)
    this.authRole.attachInlinePolicy(this.publicPolicy)
    this.authRole.attachInlinePolicy(this.readPolicy)
    this.authRole.attachInlinePolicy(this.uploadPolicy)

    this.unauthRole.attachInlinePolicy(this.publicPolicy)
    this.unauthRole.attachInlinePolicy(this.uploadPolicy)
  }
}
