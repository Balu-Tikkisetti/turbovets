export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { 
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  moduleNameMapper: {
    '^@turbovets/auth$': '<rootDir>/../../libs/auth/src/index.ts',
    '^@turbovets/auth/backend$': '<rootDir>/../../libs/auth/src/backend.ts',
    '^@turbovets/data$': '<rootDir>/../../libs/data/src/index.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  collectCoverageFrom: ['**/*.(t|j)s'],
};
