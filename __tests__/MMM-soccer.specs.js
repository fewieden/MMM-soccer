describe('MMM-soccer', () => {
    beforeAll(() => {
       require('../__mocks__/Logger');
       require('../__mocks__/Module');
    });

    const name = 'MMM-soccer';

    let MMMsoccer;

    beforeEach(() => {
        require('../MMM-soccer');

        MMMsoccer = global.Module.create(name);
        MMMsoccer.setData({name, identifier: `Module_1_${name}`});
    });

    test('requires version 2.14', () => {
        expect(MMMsoccer.requiresVersion).toBe('2.14.0');
    });

    test('has correct defaults', () => {
        expect(MMMsoccer.defaults).toMatchSnapshot();
    });

    test('has correct voice commands', () => {
        expect(MMMsoccer.voice).toMatchSnapshot();
    });

    test('inits module with state loading === true', () => {
        expect(MMMsoccer.loading).toBe(true);
    });

    describe('start', () => {
        let originalInterval = setInterval;

        beforeEach(() => {
            global.setInterval = jest.fn();
        });

        afterEach(() => {
            global.setInterval = originalInterval;
        });

        test('logs start of module', () => {
            MMMsoccer.start();

            expect(global.Log.info).toHaveBeenNthCalledWith(1, 'Starting module: MMM-soccer');
        });

        test('adds nunjuck filters', () => {
            MMMsoccer.start();

            const addFilter = MMMsoccer.nunjucksEnvironment().addFilter;
            expect(addFilter).toBeCalledTimes(1);
            expect(addFilter).toHaveBeenNthCalledWith(1, 'fade', expect.any(Function));
        });

        test('inits current league', () => {
            MMMsoccer.start();

            expect(MMMsoccer.currentLeague).toBe('BL1');
        });

        test('requests data from node_helper', () => {
            MMMsoccer.start();

            expect(MMMsoccer.sendSocketNotification).toHaveBeenNthCalledWith(1, 'GET_DATA', {
                api_key: false, league: 'BL1'
            });
        });

        test('interval requests data from node_helper', () => {
            MMMsoccer.start();

            global.setInterval.mock.calls[0][0]();

            expect(MMMsoccer.sendSocketNotification).toHaveBeenCalledTimes(2);
            expect(MMMsoccer.sendSocketNotification).toHaveBeenNthCalledWith(2, 'GET_DATA', {
                api_key: false, league: 'BL1'
            });
        });

        test('inits interval correctly for usage with api_key', () => {
            MMMsoccer.start();

            expect(global.setInterval).toHaveBeenNthCalledWith(1, expect.any(Function), 1800000);
        });

        test('inits interval correctly for usage without api_key', () => {
            MMMsoccer.setConfig({api_key: 'TEST_API_KEY'});

            MMMsoccer.start();

            expect(global.setInterval).toHaveBeenNthCalledWith(1, expect.any(Function), 300000);
        });
    });
});
