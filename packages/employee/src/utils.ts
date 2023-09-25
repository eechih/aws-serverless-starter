import { parse } from 'csv-parse/sync'

import S3Client from './Client'
import { Employee, Probability, ProbabilityGroup } from './types'

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length
  let randomIndex

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

export async function downloadProbabilities(
  bucket: S3Client,
  version: string,
  prGroup: ProbabilityGroup
): Promise<Probability[]> {
  console.log(`downloading probabilities for ${prGroup} group...`)

  // Download the CSV content
  const key = `configurations/${version}/EmployeeProbability.csv`
  console.log(`downloading ${key}`)
  const content = await bucket.getObject({ key })

  // Parse the CSV content
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  })

  const probabilities: Probability[] = records
    .map((record: any) => {
      const probability =
        prGroup == ProbabilityGroup.GoldCoin
          ? record['金幣單張機率']
          : record['IS單張機率']

      const shardProbability =
        prGroup == ProbabilityGroup.GoldCoin
          ? record['金幣碎片機率']
          : record['IS碎片機率']

      return {
        name: record['名稱'],
        grade: record['等級'],
        probability: parseFloat(probability),
        shardProbability: parseFloat(shardProbability),
      } as Probability
    })
    .filter((p: Probability) => {
      return p.name !== null && p.name.trim() !== ''
    })
  console.log('downloaded probabilities:', probabilities)
  return probabilities
}

export async function randomEmployees(
  limit: number,
  probabilities: Probability[]
): Promise<Employee[]> {
  console.log(`randomly select ${limit} employees...`)

  const employees: Employee[] = []

  for (var i = 0; i < limit; i++) {
    const shuffledProbabilities = shuffle(probabilities)
    const randomNumber = Math.random()
    var accProbability = 0.0

    for (const pr of shuffledProbabilities) {
      const { name, grade, probability, shardProbability } = pr
      accProbability += probability
      if (randomNumber < accProbability) {
        employees.push({ name, grade, isShard: false })
        break
      }
      accProbability += shardProbability
      if (randomNumber < accProbability) {
        employees.push({ name, grade, isShard: true })
        break
      }
    }
  }
  console.log('selected employees:', employees)
  return employees
}
