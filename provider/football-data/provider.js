const _ = require('lodash');
const fetch = require('node-fetch');

const {registerProvider} = require('../provider');
const {SoccerError, COMPETITION_NOT_SUPPORTED, FETCHING_STANDINGS, FETCHING_SCORERS, API_LIMIT_REACHED, API_KEY_REQUIRED} = require('../utils');

const {getTeamCode, getTeamLogo} = require('./teams');
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
        logo: getTeamLogo(entry.team),
        team: getTeamCode(entry.team),
        playedGames: entry.playedGames,
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
        standings: _.map(standings, mapStandingEntry)
    };
}

async function fetchScorers(competition) {
    const competitionId = getCompetitionId(competition);

    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/scorers?limit=50`, getRequestOptions());

    if (!response.ok) {
        const reason = response.status === 429 ? API_LIMIT_REACHED : FETCHING_SCORERS;

        throw new SoccerError(reason, {competition, provider: PROVIDER_NAME});
    }

    const parsedResponse = await response.json();

    const scorers = [];

    _.forEach(parsedResponse.scorers, (entry, index) => {
        scorers.push({
            position: index + 1,
            name: _.get(entry, ['player', 'name']),
            logo: getTeamLogo(entry.team),
            team: getTeamCode(entry.team),
            value: entry.numberOfGoals
        });
    });

    return {
        code: competition,
        scorers
    };
}

function init(config) {
    apiKey = config.api_key;
}

registerProvider(PROVIDER_NAME, {init, fetchStandings, fetchScorers});
