const _ = require('lodash');

const {SoccerError, PROVIDER_ALREADY_REGISTERED, METHOD_NOT_IMPLEMENTED, INVALID_PROVIDER} = require('./utils');

const provider = {};

function registerProvider(name, implementation) {
    if (provider[name]) {
        throw new SoccerError(PROVIDER_ALREADY_REGISTERED, {provider: name});
    }

    provider[name] = {
        init(config) {},
        fetchStandings(competition) {
            throw new SoccerError(METHOD_NOT_IMPLEMENTED, {competition, provider: name});
        },
        fetchScorers(competition) {
            throw new SoccerError(METHOD_NOT_IMPLEMENTED, {competition, provider: name});
        },
        fetchSchedules(competition) {
            throw new SoccerError(METHOD_NOT_IMPLEMENTED, {competition, provider: name});
        },
        ...implementation
    };
}

function getProvider(name) {
    if (!provider[name]) {
        throw new SoccerError(INVALID_PROVIDER, {provider: name});
    }

    return provider[name];
}

async function initProvider(config) {
    for (const name in provider) {
        const providerConfig = _.get(config, ['provider', name], {});
        await getProvider(name).init(providerConfig);
    }
}

module.exports = {registerProvider, getProvider, initProvider};
