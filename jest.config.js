module.exports = {
    moduleFileExtensions: [
        'js'
    ],
    testEnvironment: 'node',
    testRegex: '(/__tests__/.*)\\.specs.js$',
    testPathIgnorePatterns: ['setupJest.js'],
    setupFilesAfterEnv: [
        '<rootDir>/setupJest.js'
    ],
    collectCoverageFrom: [
        'MMM-soccer.js',
        'node_helper.js'
    ],
    coverageThreshold: {
        global: {
            branches:   100,
            functions:  100,
            statements: 100
        }
    }
};
