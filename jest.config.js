module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}

process.env = Object.assign(process.env, {
  AWS_REGION: 'mock_region',
  BUCKET_NAME: 'mock_bucket_name',
})
