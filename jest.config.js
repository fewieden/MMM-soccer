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
    ]
};
