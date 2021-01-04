require('jest-fetch-mock').enableMocks();

global.waitForAsync = () => new Promise(resolve => setImmediate(resolve));

const {mockConsole, restoreConsole} = require('./__mocks__/console');

beforeAll(mockConsole);

afterEach(() => {
    fetchMock.mockClear();
    jest.clearAllMocks();
});

afterAll(restoreConsole);
