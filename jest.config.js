const full = {
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100,
};

module.exports = {
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/src/tests/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 80,
      functions: 99,
      lines: 95,
    },
    './src/controllers/': full,
    './src/jobs/': full,
    './src/models/': full,
  },
  coveragePathIgnorePatterns: [
    '<rootDir>/src/application',
    '<rootDir>/src/config',
    '<rootDir>/src/lib',
    '<rootDir>/src/tests',
    '<rootDir>/src/types',
    '<rootDir>/node_modules/',
    '<rootDir>/temp/',
    '<rootDir>/temp_test/',
    '<rootDir>/output/',
  ],
};
