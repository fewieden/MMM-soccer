global.Module = {
    definitions: {},
    create(name) {
        return this.definitions[name];
    },
    register(name, overrides) {
        const base = {
            requiresVersion: '2.0.0',

            defaults: {},

            showHideTimer: null,

            lockStrings: [],

            _nunjucksEnvironment: {addFilter: jest.fn()},

            init() {
                Log.log(this.defaults);
            },

            start() {
                Log.info('Starting module: ' + this.name);
            },

            getScripts() {
                return [];
            },

            getStyles() {
                return [];
            },

            getTranslations() {
                return false;
            },

            getDom: jest.fn(),

            getHeader() {
                return this.data.header;
            },

            getTemplate() {
                return '<div class="normal">' + this.name + '</div><div class="small dimmed">' + this.identifier + '</div>';
            },

            getTemplateData() {
                return {};
            },

            notificationReceived(notification, payload, sender) {
                if (sender) {
                    Log.log(this.name + ' received a module notification: ' + notification + ' from sender: ' + sender.name);
                } else {
                    Log.log(this.name + ' received a system notification: ' + notification);
                }
            },

            nunjucksEnvironment() {
                return this._nunjucksEnvironment;
            },

            socketNotificationReceived(notification, payload) {
                Log.log(this.name + ' received a socket notification: ' + notification + ' - Payload: ' + payload);
            },

            suspend() {
                Log.log(this.name + ' is suspended.');
            },

            resume() {
                Log.log(this.name + ' is resumed.');
            },

            setData(data) {
                this.data = data;
                this.name = data.name;
                this.identifier = data.identifier;
                this.hidden = false;

                this.setConfig(data.config, data.configDeepMerge);
            },

            setConfig(config) {
                this.config = Object.assign({}, this.defaults, config);
            },

            translate: jest.fn(),

            updateDom: jest.fn(),

            sendNotification: jest.fn(),

            sendSocketNotification: jest.fn(),

            hide: jest.fn((speed, callback) => {
                if (typeof callback === 'object') {
                    callback = jest.fn();
                }

                callback = callback || jest.fn();

                global.Module.definitions[name].hidden = true;
                global.Module.definitions[name].suspend();
                callback();
            }),

            show: jest.fn((speed, callback) => {
                if (typeof callback === 'object') {
                    callback = jest.fn();
                }

                callback = callback || jest.fn();

                global.Module.definitions[name].hidden = false;
                global.Module.definitions[name].resume();
                callback();
            })
        };

        this.definitions[name] = {...base, ...overrides};
    }
};
