const {getProvider, initProvider} = require('./provider');
const {handleError, DATA_TYPES} = require('./utils');

require('./football-data');

module.exports = {getProvider, initProvider, handleError, DATA_TYPES};
