import { AppSyncResolverEvent } from 'aws-lambda'
import { bucket } from './index'
import {
  EmployeeConnection,
  ProbabilityGroup,
  RandomEmployeesArgs,
} from './types'
import { downloadProbabilities, randomEmployees } from './utils'

export const isAppSyncResolverEvent = (event: any): boolean => {
  return 'arguments' in event && 'source' in event && 'request' in event
}

export default async function (
  event: AppSyncResolverEvent<RandomEmployeesArgs>
): Promise<EmployeeConnection | void> {
  const { fieldName } = event.info
  if (fieldName === 'randomEmployees') {
    let { limit = 1, prGroup, version } = event.arguments as RandomEmployeesArgs
    if (prGroup !== ProbabilityGroup.ISCoin) {
      prGroup = ProbabilityGroup.GoldCoin
    }
    const probabilities = await downloadProbabilities(bucket, version, prGroup)
    const employees = await randomEmployees(limit, probabilities)
    return { items: employees, version } as EmployeeConnection
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
