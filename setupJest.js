require('jest-fetch-mock').enableMocks();

global.waitForAsync = () => new Promise(resolve => setImmediate(resolve));

afterEach(() => {
    fetchMock.mockClear();
    jest.clearAllMocks();
});
