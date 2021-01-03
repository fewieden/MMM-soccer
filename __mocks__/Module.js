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

            getDom() {},

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

            socket() {},

            file(file) {
                return (this.data.path + '/' + file).replace('//', '/');
            },

            loadStyles(callback) {
                this.loadDependencies('getStyles', callback);
            },

            loadScripts(callback) {
                this.loadDependencies('getScripts', callback);
            },

            loadDependencies(funcName, callback) {},

            loadTranslations(callback) {},

            translate(key, defaultValueOrVariables, defaultValue) {},

            updateDom(speed) {},

            sendNotification(notification, payload) {},

            sendSocketNotification: jest.fn(),

            hide(speed, callback, options) {
                if (typeof callback === 'object') {
                    options = callback;
                    callback = function () {
                    };
                }

                callback = callback || function () {
                };
                options = options || {};

                const self = this;
                MM.hideModule(
                    self,
                    speed,
                    () => {
                        self.suspend();
                        callback();
                    },
                    options
                );
            },

            show(speed, callback, options) {
                if (typeof callback === 'object') {
                    options = callback;
                    callback = function () {
                    };
                }

                callback = callback || function () {
                };
                options = options || {};

                const self = this;
                MM.showModule(
                    this,
                    speed,
                    () => {
                        self.resume();
                        callback();
                    },
                    options
                );
            }
        };

        this.definitions[name] = {...base, ...overrides};
    }
};












module.exports = {
    requiresVersion: '2.0.0',

    defaults: {},

    showHideTimer: null,

    lockStrings: [],

    _nunjucksEnvironment: null,

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

    getDom() {
    },

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

    setConfig(config, deep) {
        this.config = deep ? configMerge({}, this.defaults, config) : Object.assign({}, this.defaults, config);
    },

    socket() {
    },

    file(file) {
        return (this.data.path + '/' + file).replace('//', '/');
    },

    loadStyles(callback) {
        this.loadDependencies('getStyles', callback);
    },

    loadScripts(callback) {
        this.loadDependencies('getScripts', callback);
    },

    loadDependencies(funcName, callback) {
    },

    loadTranslations(callback) {
    },

    translate(key, defaultValueOrVariables, defaultValue) {
    },

    updateDom(speed) {
    },

    sendNotification(notification, payload) {
    },

    sendSocketNotification(notification, payload) {
    },

    hide(speed, callback, options) {
        if (typeof callback === 'object') {
            options = callback;
            callback = function () {
            };
        }

        callback = callback || function () {
        };
        options = options || {};

        const self = this;
        MM.hideModule(
            self,
            speed,
            () => {
                self.suspend();
                callback();
            },
            options
        );
    },

    show(speed, callback, options) {
        if (typeof callback === 'object') {
            options = callback;
            callback = function () {
            };
        }

        callback = callback || function () {
        };
        options = options || {};

        const self = this;
        MM.showModule(
            this,
            speed,
            () => {
                self.resume();
                callback();
            },
            options
        );
    }
};
