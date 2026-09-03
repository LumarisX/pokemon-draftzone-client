module.exports = {
  preset: 'jest-preset-angular',
  maxWorkers: 4,
  workerIdleMemoryLimit: '1GB',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  moduleNameMapper: {
    '^@pdz/sets$': '<rootDir>/node_modules/@pdz/sets/build/cjs/index.js',
    '^@pdz/core/(.*)$': '<rootDir>/src/pdz/core/$1',
    '^@pdz/shared/(.*)$': '<rootDir>/src/pdz/shared/$1',
    '^@pdz/features/(.*)$': '<rootDir>/src/pdz/features/$1',
    '^@pdz/layout/(.*)$': '<rootDir>/src/pdz/layout/$1',
    '^@pdz/environments/(.*)$': '<rootDir>/src/environments/$1',
    '^@pdz/(.*)$': '<rootDir>/src/pdz/$1',
  },
};
