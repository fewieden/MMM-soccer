const {getProvider, initProvider} = require('./provider');
const {handleError} = require('./utils');

require('./football-data');

module.exports = {getProvider, initProvider, handleError};
