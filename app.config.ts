import * as fs from 'fs'
import { load } from 'js-yaml'
import * as path from 'path'

let appConfig
try {
  appConfig = load(
    fs.readFileSync(path.resolve('./app.config.yaml'), 'utf8')
  ) as Record<string, any>
} catch (err) {
  console.log(err)
  throw new Error('The application must be configured in app.config.yaml')
}

export default {
  nsDomain: appConfig.domainConfig.nsDomain,
  runtime: 'nodejs16.x',
  sourceRepoOwner: appConfig.sourceRepo.owner,
  sourceRepoName: appConfig.sourceRepo.name,
  sourceBranch: appConfig.sourceRepo.branch,
  siteBucketPrefix: appConfig.domainConfig.siteBucketPrefix,
  appName: appConfig.sourceRepo.name,
}
