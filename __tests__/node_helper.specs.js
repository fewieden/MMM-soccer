const {generateResponse} = require('../__mocks__/mockResponse');

describe('node_helper', () => {
    let helper;

    beforeEach(() => {
        helper = require('../node_helper');

        helper.setName('MMM-soccer');

        fetchMock.mockResponseOnce(JSON.stringify(generateResponse()), {status: 200});
    });

    test('start prints module name', () => {
        helper.start();

        expect(console.log).toHaveBeenCalledWith('Starting module helper: MMM-soccer');
    });

    test('triggers data fetch without api_key if notification is GET_DATA', () => {
        helper.socketNotificationReceived('GET_DATA', {league: 'BL1'});

        expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://api.football-data.org/v2/competitions/BL1/standings', {});
    });

    test('triggers data fetch with api key if notification is GET_DATA', () => {
        const apiKey = 'TEST_API_KEY';
        helper.socketNotificationReceived('GET_DATA', {league: 'BL1', api_key: apiKey});

        expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://api.football-data.org/v2/competitions/BL1/standings', {
            headers: {
                'X-Auth-Token': apiKey
            }
        });
    });

    test('data fetching sends response via socket to module on success', async() => {
        helper.socketNotificationReceived('GET_DATA', {league: 'BL1'});

        await waitForAsync();

        expect(helper.sendSocketNotification.mock.calls[0][0]).toBe('DATA');
        expect(helper.sendSocketNotification.mock.calls[0][1]).toMatchSnapshot();
    });

    test('data fetching logs error on failure', async() => {
        fetchMock.resetMocks();
        fetchMock.mockResponseOnce(JSON.stringify({message: 'Forbidden'}), {status: 403});

        helper.socketNotificationReceived('GET_DATA', {league: 'BL1'});

        await waitForAsync();

        expect(console.error).toHaveBeenCalledWith('Getting league table: 403 Forbidden');
        expect(helper.sendSocketNotification).not.toHaveBeenCalled();
    });

    test('does NOT trigger data fetch if notification is different than GET_DATA', () => {
        helper.socketNotificationReceived('OTHER NOTIFICATION');

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
