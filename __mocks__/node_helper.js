const Log = require("logger");

module.exports = {
    create(overrides) {
        const base = {
            init() {
                Log.log("Initializing new module helper ...");
            },

            loaded(callback) {
                Log.log(`Module helper loaded: ${this.name}`);
                callback();
            },

            start() {
                Log.log(`Starting module helper: ${this.name}`);
            },

            stop() {
                Log.log(`Stopping module helper: ${this.name}`);
            },

            socketNotificationReceived(notification, payload) {
                Log.log(`${this.name} received a socket notification: ${notification} - Payload: ${payload}`);
            },

            setName(name) {
                this.name = name;
            },

            setPath(path) {
                this.path = path;
            },

            sendSocketNotification: jest.fn(),

            setExpressApp: jest.fn(),

            setSocketIO: jest.fn()
        };

        return {...base, ...overrides};
    }
};
