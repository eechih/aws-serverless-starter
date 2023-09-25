import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sdkStreamMixin } from '@aws-sdk/util-stream-node'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { createReadStream } from 'fs'

import { join } from 'path'

import { bucket } from '../src/index'
import { ProbabilityGroup } from '../src/types'
import { downloadProbabilities } from '../src/utils'

const s3Mock = mockClient(S3Client)

beforeEach(() => {
  s3Mock.reset()
})

test('filter out invaild employee probability', async () => {
  for (const group of [ProbabilityGroup.ISCoin, ProbabilityGroup.GoldCoin]) {
    s3Mock.on(GetObjectCommand).resolves({
      Body: sdkStreamMixin(
        createReadStream(join(__dirname, 'EmployeeProbability.csv'))
      ),
    })

    const probabilities = await downloadProbabilities(bucket, 'x.x.x', group)

    const sum = probabilities.reduce(
      (sum, p) => sum + p.probability + p.shardProbability,
      0
    )
    console.log('sum', sum)
    expect(sum).toBeCloseTo(1)
  }
})
