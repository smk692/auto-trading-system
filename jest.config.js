/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Roots for tests
  roots: ['<rootDir>/tests', '<rootDir>/src'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        // Use the same strict settings as main tsconfig
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true
      }
    }]
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types$': '<rootDir>/src/types',
    '^@/broker$': '<rootDir>/src/broker',
    '^@/data$': '<rootDir>/src/data',
    '^@/strategy$': '<rootDir>/src/strategy',
    '^@/risk$': '<rootDir>/src/risk',
    '^@/order$': '<rootDir>/src/order',
    '^@/db$': '<rootDir>/src/db',
    '^@/kafka$': '<rootDir>/src/kafka',
    '^@/monitoring$': '<rootDir>/src/monitoring',
    '^@/config$': '<rootDir>/src/config'
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/types/**/*'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Setup files
  setupFilesAfterEnv: [],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Max workers for parallel test execution
  maxWorkers: '50%'
};
