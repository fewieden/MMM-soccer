describe('MMM-soccer', () => {
    beforeAll(() => {
       require('../__mocks__/Logger');
       require('../__mocks__/Module');
    });

    const name = 'MMM-soccer';

    let MMMsoccer;

    beforeEach(() => {
        jest.resetModules();
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

    describe('socketNotificationReceived', () => {
        const {generateResponse} = require('../__mocks__/mockResponse');

        const payload = generateResponse();

        test('sets loading to false after receiving data', () => {
            MMMsoccer.socketNotificationReceived('DATA', payload);

            expect(MMMsoccer.loading).toBe(false);
        });

        test('updates dom after receiving data', () => {
            MMMsoccer.socketNotificationReceived('DATA', payload);

            expect(MMMsoccer.updateDom).toHaveBeenNthCalledWith(1, 300);
        });

        test('assigns data correctly', () => {
            MMMsoccer.socketNotificationReceived('DATA', payload);

            expect(MMMsoccer.standing).toMatchObject(payload.standings[0].table);
            expect(MMMsoccer.competition).toMatchObject(payload.competition);
            expect(MMMsoccer.season).toMatchObject(payload.season);
        });

        test('does nothing if notification is different than DATA', () => {
            MMMsoccer.socketNotificationReceived('OTHER NOTIFICATION', payload);

            expect(MMMsoccer.loading).toBe(true);
        });
    });

    describe('notificationReceived', () => {
        test('registers voice commands', () => {
            MMMsoccer.notificationReceived('ALL_MODULES_STARTED');

            expect(MMMsoccer.sendNotification.mock.calls[0]).toMatchSnapshot();
        });

        test('executes voice commands', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'OPEN HELP', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification.mock.calls[0]).toMatchSnapshot();
        });

        test('closes modal after current voice mode was changed to other module', () => {
            MMMsoccer.notificationReceived('VOICE_MODE_CHANGED', {old: 'SOCCER'}, {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).toHaveBeenNthCalledWith(1, 'CLOSE_MODAL');
        });

        test('does NOT trigger notifications', () => {
            MMMsoccer.notificationReceived('OTHER NOTIFICATION');

            expect(MMMsoccer.sendNotification).not.toHaveBeenCalled();
        });
    });

    test('registers font-awesome and custom css', () => {
        expect(MMMsoccer.getStyles()).toMatchObject(['font-awesome.css', 'MMM-soccer.css']);
    });

    test('translations are matching translation files', () => {
        const translations = MMMsoccer.getTranslations();

        const {readdirSync} = require('fs');
        const {join} = require('path');
        const translationFiles = readdirSync(join(__dirname, '..', 'translations'));

        expect(Object.keys(translations).length).toBe(5);
        expect(translationFiles.length).toBe(5);

        for (const file of translationFiles) {
            const language = file.replace('.json', '');
            expect(translations[language]).toBe(`translations/${language}.json`);
        }
    });

    test('returns template path inside templates dir', () => {
        expect(MMMsoccer.getTemplate()).toBe(`templates/${name}.njk`);
    });

    describe('executeVoiceCommands', () => {
        test('opens help modal', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'OPEN HELP', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).toHaveBeenNthCalledWith(1, 'OPEN_MODAL', {
                data: expect.any(Object),
                template: 'templates/HelpModal.njk'
            });
        });

        test('closes help modal', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'CLOSE HELP', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).toHaveBeenNthCalledWith(1, 'CLOSE_MODAL');
        });

        test('does NOTHING if help modal but NO open/close keyword', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'HELP', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).not.toHaveBeenCalled();
        });

        test('opens standings modal', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'EXPAND VIEW', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).toHaveBeenNthCalledWith(1, 'OPEN_MODAL', {
                data: expect.any(Object),
                template: 'templates/StandingsModal.njk'
            });
        });

        test('closes standings modal', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'COLLAPSE VIEW', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).toHaveBeenNthCalledWith(1, 'CLOSE_MODAL');
        });

        test('does NOTHING if standings modal but NO expand/collapse keyword', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'VIEW', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).not.toHaveBeenCalled();
        });

        test('switches current league to premiere league and requests new data', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'STANDINGS ENGLAND', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).toHaveBeenNthCalledWith(1, 'CLOSE_MODAL');
            expect(MMMsoccer.currentLeague).toBe('PL');
            expect(MMMsoccer.sendSocketNotification).toHaveBeenNthCalledWith(1, 'GET_DATA', {
                api_key: false, league: 'PL'
            });
        });

        test('requests NO data if user tries to switch to same league', () => {
            MMMsoccer.currentLeague = 'BL1';
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'STANDINGS GERMANY', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).toHaveBeenNthCalledWith(1, 'CLOSE_MODAL');
            expect(MMMsoccer.sendSocketNotification).not.toHaveBeenCalled();
        });

        test('does NOT switch league if league/country is unknown', () => {
            MMMsoccer.notificationReceived('VOICE_SOCCER', 'VIEW', {name: 'MMM-voice'});

            expect(MMMsoccer.sendNotification).not.toHaveBeenCalled();
            expect(MMMsoccer.sendSocketNotification).not.toHaveBeenCalled();
        });
    });
});
