export type Probability = {
  name: string
  grade: string
  probability: number
  shardProbability: number
}

export enum ProbabilityGroup {
  GoldCoin = 'GoldCoin',
  ISCoin = 'ISCoin',
}

export type Employee = {
  name: string // 名稱
  grade: string // 等級
  isShard?: boolean // 是否為碎片？
}

export type EmployeeConnection = {
  items: Employee[]
  scannedCount?: number
  nextToken?: string
  version: string
}

export type RandomEmployeesArgs = {
  version: string
  limit?: number
  prGroup?: ProbabilityGroup
}
