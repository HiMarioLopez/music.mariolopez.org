module.exports = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  transform: {
    '^.+\\.ts$': ['@swc/jest']
  },
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};