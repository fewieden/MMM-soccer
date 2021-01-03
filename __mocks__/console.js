const originalConsole = {...global.console};

function mockConsole() {
    global.console.log = jest.fn();
    global.console.warn = jest.fn();
    global.console.info = jest.fn();
    global.console.error = jest.fn();
}

function restoreConsole() {
    global.console = originalConsole;
}

module.exports = {mockConsole, restoreConsole};
