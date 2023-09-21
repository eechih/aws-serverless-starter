import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'

let app
try {
  app = load(fs.readFileSync(path.resolve('./app.yml'), 'utf8')) as Record<
    string,
    any
  >
} catch (err) {
  console.log(err)
  throw new Error('The application must be configured in app.yml')
}

export default {
  appName: app.appName,
  gitRepo: app.gitRepo,
  gitBranch: app.gitBranch,
  nsDomain: app.domainConfig.nsDomain,
  siteBucketPrefix: app.domainConfig.siteBucketPrefix,
  google: {
    clientId: app.google.clientId,
    clientSecret: {
      // The ID used to load the secret from AWS Secrets Manager.
      secretId: `${app.appName}-google-client-secret`,
    },
    enabled: app.google.clientId !== '',
  },
  facebook: {
    appId: app.facebook.appId,
    appSecret: {
      // The ID used to load the secret from AWS Secrets Manager.
      secretId: `${app.appName}-facebook-app-secret`,
    },
    enabled: app.facebook.appId !== '',
  },
  apple: {
    servicesId: app.apple.servicesId,
    teamId: app.apple.teamId,
    keyId: app.apple.keyId,
    privateKey: {
      // The ID used to load the secret from AWS Secrets Manager.
      secretId: `${app.appName}-apple-private-key`,
    },
    enabled: app.apple.servicesId !== '',
  },
}
