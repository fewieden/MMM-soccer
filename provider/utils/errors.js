const COMPETITION_NOT_SUPPORTED = 'COMPETITION_NOT_SUPPORTED';
const FETCHING_STANDINGS = 'FETCHING_STANDINGS';
const PROVIDER_ALREADY_REGISTERED = 'PROVIDER_ALREADY_REGISTERED';
const METHOD_NOT_IMPLEMENTED = 'METHOD_NOT_IMPLEMENTED';
const INVALID_PROVIDER = 'INVALID_PROVIDER';
const API_LIMIT_REACHED = 'API_LIMIT_REACHED';
const API_KEY_REQUIRED = 'API_KEY_REQUIRED';

class SoccerError extends Error {
    constructor(reason, {competition, provider}) {
        super(reason);
        this.competition = competition;
        this.provider = provider;
        this.name = 'SoccerError';
    }
}

function handleError(error) {
    console.error('[MMM-soccer]:', error);
}

module.exports = {
    SoccerError,
    handleError,
    COMPETITION_NOT_SUPPORTED,
    FETCHING_STANDINGS,
    PROVIDER_ALREADY_REGISTERED,
    METHOD_NOT_IMPLEMENTED,
    INVALID_PROVIDER,
    API_LIMIT_REACHED,
    API_KEY_REQUIRED
};
