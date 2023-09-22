import * as fs from 'fs'
import { load } from 'js-yaml'
import { resolve } from 'path'

export interface AppConfig {
  appName: string
  deployAccount: string
  deployRegion: string
  sourceConfig: SourceConfig
  domainConfig?: DomainConfig
  identityProviders: IdentityProviders
}

export interface SourceConfig {
  gitRepo: string
  gitBranch: string
}

export interface DomainConfig {
  nsDomain: string
  domainPrefixes: Record<string, string>
  apiCertificateArns: Record<string, string>
}

export interface IdentityProviders {
  google?: {
    clientId: string
    clientSecret: {
      secretId: string
    }
  }
  facebook?: {
    appId: string
    appSecret: {
      secretId: string
    }
  }
  apple?: {
    servicesId: string
    teamId: string
    keyId: string
    privateKey: {
      secretId: string
    }
  }
}

export interface Environment {
  account: string
  region: string
}

let appConfig
try {
  const filePath = resolve('./app.yml')
  appConfig = load(fs.readFileSync(filePath, 'utf8')) as Record<string, any>
  console.log('AppConfig:', JSON.stringify(appConfig, null, 2))
} catch (err) {
  console.log(err)
  throw new Error('The application must be configured in app.yml')
}

export default {
  appName: appConfig.appName,
  deployAccount: appConfig.deployAccount,
  deployRegion: appConfig.deployRegion,
  sourceConfig: appConfig.sourceConfig,
  domainConfig: appConfig.domainConfig.nsDomain
    ? appConfig.domainConfig
    : undefined,
  identityProviders: {
    google: appConfig.identityProviders.google.clientId
      ? appConfig.identityProviders.google
      : undefined,
    facebook: appConfig.identityProviders.facebook.appId
      ? appConfig.identityProviders.facebook
      : undefined,
    apple: appConfig.identityProviders.apple.servicesId
      ? appConfig.identityProviders.apple
      : undefined,
  },
} as AppConfig
