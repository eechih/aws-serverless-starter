import * as cdk from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

import config from './config'

export interface CognitoConstructProps {
  stageName: string
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.IUserPoolClient
  public readonly identityProviderGoogle: cognito.UserPoolIdentityProviderGoogle
  public readonly identityProviderFacebook: cognito.UserPoolIdentityProviderFacebook
  public readonly identityProviderApple: cognito.UserPoolIdentityProviderApple
  public readonly identityPool: cognito.CfnIdentityPool

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id)

    const { stageName } = props

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${config.appName}-${stageName}_userpool`,
      selfSignUpEnabled: true, // allow users to sign up
      autoVerify: { email: true }, // verify email addresses by sending a verification code
      signInAliases: { email: true }, // set email as an alias
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: (() => {
        switch (stageName) {
          case 'dev':
            return {
              minLength: 6,
              requireLowercase: false,
              requireUppercase: false,
              requireDigits: false,
              requireSymbols: false,
            }
          default:
            return undefined // use default PasswordPolicy
        }
      })(),
      removalPolicy: (() => {
        switch (stageName) {
          case 'dev':
            return cdk.RemovalPolicy.DESTROY
          default:
            return cdk.RemovalPolicy.RETAIN
        }
      })(),
    })

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        ...(config.google.enabled
          ? [cognito.UserPoolClientIdentityProvider.GOOGLE]
          : []),
        ...(config.facebook.enabled
          ? [cognito.UserPoolClientIdentityProvider.FACEBOOK]
          : []),
        ...(config.apple.enabled
          ? [cognito.UserPoolClientIdentityProvider.APPLE]
          : []),
      ],
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
        custom: true,
      },
      oAuth: {
        callbackUrls: ['http://localhost:3000/'],
        logoutUrls: ['http://localhost:3000/'],
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.COGNITO_ADMIN,
        ],
      },
    })

    if (config.google.enabled) {
      this.identityProviderGoogle = new cognito.UserPoolIdentityProviderGoogle(
        this,
        'UserPoolIdentityProviderGoogle',
        {
          userPool: this.userPool,
          clientId: config.google.clientId,
          clientSecretValue: cdk.SecretValue.secretsManager(
            config.google.clientSecret.secretId
          ),
          scopes: ['profile'],
          attributeMapping: {
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          },
        }
      )
      this.userPoolClient.node.addDependency(this.identityProviderGoogle)
    }

    if (config.facebook.enabled) {
      this.identityProviderFacebook =
        new cognito.UserPoolIdentityProviderFacebook(
          this,
          'UserPoolIdentityProviderFacebook',
          {
            userPool: this.userPool,
            clientId: config.facebook.appId,
            clientSecret: cdk.SecretValue.secretsManager(
              config.facebook.appSecret.secretId
            ).unsafeUnwrap(),
            scopes: ['public_profile'],
            attributeMapping: {
              givenName: cognito.ProviderAttribute.FACEBOOK_NAME,
            },
          }
        )
      this.userPoolClient.node.addDependency(this.identityProviderFacebook)
    }

    if (config.apple.enabled) {
      this.identityProviderApple = new cognito.UserPoolIdentityProviderApple(
        this,
        'UserPoolIdentityProviderApple',
        {
          userPool: this.userPool,
          clientId: config.apple.servicesId,
          teamId: config.apple.teamId,
          keyId: config.apple.keyId,
          privateKey: cdk.SecretValue.secretsManager(
            config.apple.privateKey.secretId
          ).unsafeUnwrap(),
          scopes: ['public_profile'],
          attributeMapping: {
            givenName: cognito.ProviderAttribute.FACEBOOK_NAME,
          },
        }
      )
      this.userPoolClient.node.addDependency(this.identityProviderFacebook)
    }

    this.identityPool = new cognito.CfnIdentityPool(this, 'CfnIdentityPool', {
      identityPoolName: `${config.appName}-${stageName}_identityPool`,
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
      supportedLoginProviders: {
        ...(config.google.enabled
          ? { 'accounts.google.com': config.google.clientId }
          : {}),
        ...(config.facebook.enabled
          ? { 'graph.facebook.com': config.facebook.appId }
          : {}),
        ...(config.apple.enabled
          ? { 'appleid.apple.com': config.apple.servicesId }
          : {}),
      },
    })
  }

  attachRolesToIdentityPool(authRole: iam.IRole, unauthRole: iam.IRole) {
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      'CfnIdentityPoolRoleAttachment',
      {
        identityPoolId: this.identityPool.ref,
        roles: {
          authenticated: authRole.roleArn,
          unauthenticated: unauthRole.roleArn,
        },
      }
    )
  }
}
