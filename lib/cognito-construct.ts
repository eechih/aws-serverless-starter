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
  public readonly userPoolDomain: cognito.UserPoolDomain
  public readonly userPoolClient: cognito.IUserPoolClient
  public readonly identityProviderGoogle: cognito.UserPoolIdentityProviderGoogle
  public readonly identityProviderFacebook: cognito.UserPoolIdentityProviderFacebook
  public readonly identityProviderApple: cognito.UserPoolIdentityProviderApple
  public readonly identityPool: cognito.CfnIdentityPool

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id)
    const { stageName } = props
    const { google, facebook, apple } = config.identityProviders

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

    this.userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool: this.userPool,
      cognitoDomain: { domainPrefix: `${config.appName}-${stageName}` },
    })

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        ...(google ? [cognito.UserPoolClientIdentityProvider.GOOGLE] : []),
        ...(facebook ? [cognito.UserPoolClientIdentityProvider.FACEBOOK] : []),
        ...(apple ? [cognito.UserPoolClientIdentityProvider.APPLE] : []),
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

    if (google) {
      this.identityProviderGoogle = new cognito.UserPoolIdentityProviderGoogle(
        this,
        'UserPoolIdentityProviderGoogle',
        {
          userPool: this.userPool,
          clientId: google.clientId,
          clientSecretValue: cdk.SecretValue.secretsManager(
            google.clientSecret.secretId
          ),
          scopes: ['profile'],
          attributeMapping: {
            givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          },
        }
      )
      this.userPoolClient.node.addDependency(this.identityProviderGoogle)
    }

    if (facebook) {
      this.identityProviderFacebook =
        new cognito.UserPoolIdentityProviderFacebook(
          this,
          'UserPoolIdentityProviderFacebook',
          {
            userPool: this.userPool,
            clientId: facebook.appId,
            clientSecret: cdk.SecretValue.secretsManager(
              facebook.appSecret.secretId
            ).unsafeUnwrap(),
            scopes: ['public_profile'],
            attributeMapping: {
              givenName: cognito.ProviderAttribute.FACEBOOK_NAME,
            },
          }
        )
      this.userPoolClient.node.addDependency(this.identityProviderFacebook)
    }

    if (apple) {
      this.identityProviderApple = new cognito.UserPoolIdentityProviderApple(
        this,
        'UserPoolIdentityProviderApple',
        {
          userPool: this.userPool,
          clientId: apple.servicesId,
          teamId: apple.teamId,
          keyId: apple.keyId,
          privateKey: cdk.SecretValue.secretsManager(
            apple.privateKey.secretId
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
        ...(google ? { 'accounts.google.com': google.clientId } : {}),
        ...(facebook ? { 'graph.facebook.com': facebook.appId } : {}),
        ...(apple ? { 'appleid.apple.com': apple.servicesId } : {}),
      },
    })

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    })

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    })

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
    })

    new cdk.CfnOutput(this, 'OAuthDomain', {
      value: `${this.userPoolDomain.domainName}.auth.${this.userPool.env.region}.amazoncognito.com`,
    })

    new cdk.CfnOutput(this, 'OAuthReturnURL', {
      value: `https://${this.userPoolDomain.domainName}.auth.${this.userPool.env.region}.amazoncognito.com/oauth2/idpresponse`,
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
