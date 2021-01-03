module.exports = {
    create(overrides) {
        for (const fn in overrides) {
            this[fn] = overrides[fn];
        }

        return this;
    },

    init() {
        console.log('Initializing new module helper ...');
    },

    loaded(callback) {
        console.log(`Module helper loaded: ${this.name}`);
        callback();
    },

    start() {
        console.log(`Starting module helper: ${this.name}`);
    },

    stop() {
        console.log(`Stopping module helper: ${this.name}`);
    },

    socketNotificationReceived(notification, payload) {
        console.log(`${this.name} received a socket notification: ${notification} Payload: ${payload}`);
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
