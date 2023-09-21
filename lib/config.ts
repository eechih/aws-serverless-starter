import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'

let appConfig
try {
  appConfig = load(
    fs.readFileSync(path.resolve('./app.yml'), 'utf8')
  ) as Record<string, any>
} catch (err) {
  console.log(err)
  throw new Error('The application must be configured in app.yml')
}

export default {
  gitRepo: appConfig.gitRepo,
  gitBranch: appConfig.gitBranch,
  appName: appConfig.appName,
  nsDomain: appConfig.domainConfig.nsDomain,
  siteBucketPrefix: appConfig.domainConfig.siteBucketPrefix,
}
