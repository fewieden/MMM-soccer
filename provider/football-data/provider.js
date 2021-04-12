const _ = require('lodash');
const fetch = require('node-fetch');

const {registerProvider} = require('../provider');
const {SoccerError, COMPETITION_NOT_SUPPORTED, FETCHING_STANDINGS, API_LIMIT_REACHED, API_KEY_REQUIRED} = require('../utils');

const {getTeamCode} = require('./teams');
const {BASE_URL, PROVIDER_NAME, COMPETITIONS} = require('./constants');

let apiKey;

function getCompetitionId(competition) {
    const competitionId = COMPETITIONS[competition];

    if (!competitionId) {
        throw new SoccerError(COMPETITION_NOT_SUPPORTED, {competition, provider: PROVIDER_NAME});
    }

    return competitionId;
}

function getRequestOptions() {
    if (!apiKey) {
        throw new SoccerError(API_KEY_REQUIRED, {provider: PROVIDER_NAME});
    }

    return {headers: {'X-Auth-Token': apiKey}};
}

function mapStandingEntry(entry = {}) {
    return {
        position: entry.position,
        logo: _.get(entry, ['team', 'crestUrl']),
        team: getTeamCode(entry.team),
        points: entry.points,
        goalDifference: entry.goalDifference
    };
}

async function fetchStandings(competition) {
    const competitionId = getCompetitionId(competition);

    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/standings`, getRequestOptions());

    if (!response.ok) {
        const reason = response.status === 429 ? API_LIMIT_REACHED : FETCHING_STANDINGS;

        throw new SoccerError(reason, {competition, provider: PROVIDER_NAME});
    }

    const parsedResponse = await response.json();

    const standings = _.get(parsedResponse, ['standings', 0, 'table']);

    return {
        code: competition,
        competition: _.get(parsedResponse, 'competition'),
        season: _.get(parsedResponse, 'season'),
        standings: _.map(standings, mapStandingEntry)
    };
}

function init(config) {
    apiKey = config.api_key;
}

registerProvider(PROVIDER_NAME, {init, fetchStandings});
