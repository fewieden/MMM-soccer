const _ = require('lodash');
const fetch = require('node-fetch');

const {registerProvider} = require('../provider');
const {SoccerError, COMPETITION_NOT_SUPPORTED, FETCHING_STANDINGS, FETCHING_SCORERS, FETCHING_SCHEDULES, API_LIMIT_REACHED, API_KEY_REQUIRED, isCompetitionTypeCup, getTeamType} = require('../utils');

const {getTeamCode, getTeamLogo} = require('./teams');
const {BASE_URL, PROVIDER_NAME, COMPETITIONS} = require('./constants');

let config;

function getCompetitionId(competition) {
    const competitionId = COMPETITIONS[competition];

    if (!competitionId) {
        throw new SoccerError(COMPETITION_NOT_SUPPORTED, {competition, provider: PROVIDER_NAME});
    }

    return competitionId;
}

function getRequestOptions() {
    if (!config?.apiKey) {
        throw new SoccerError(API_KEY_REQUIRED, {provider: PROVIDER_NAME});
    }

    return {headers: {'X-Auth-Token': config.apiKey}};
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

function mapMatchEntry(entry = {}) {
    return {
        stage: entry.stage,
        group: entry.group?.replace('Group ', ''),
        matchDay: entry.matchday,
        status: entry.status,
        timestamp: entry.utcDate,
        homeLogo: getTeamLogo(entry.homeTeam),
        homeTeam: getTeamCode(entry.homeTeam),
        homeScore: entry.score?.fullTime?.homeTeam || 0,
        awayLogo: getTeamLogo(entry.awayTeam),
        awayTeam: getTeamCode(entry.awayTeam),
        awayScore: entry.score?.fullTime?.awayTeam || 0,
    };
}

function mapGroupEntry(entry = {}) {
    return {
        details: {
            group: entry.group?.replace('GROUP_', '')
        },
        list: _.map(entry.table, mapStandingEntry)
    };
}

async function fetchStandings(competition) {
    const isCup = isCompetitionTypeCup(competition);

    const competitionId = getCompetitionId(competition);

    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/standings`, getRequestOptions());

    if (!response.ok) {
        const reason = response.status === 429 ? API_LIMIT_REACHED : FETCHING_STANDINGS;

        throw new SoccerError(reason, {competition, provider: PROVIDER_NAME});
    }

    const parsedResponse = await response.json();

    const matchDay = _.get(parsedResponse, ['season', 'currentMatchday']);

    if (isCup) {
        const stage = _.get(parsedResponse, ['standings', 0, 'stage'], '').replace('_STAGE', '');

        return {
            code: competition,
            details: {isCup, matchDay, stage, team: getTeamType(competition)},
            groups: _.map(parsedResponse?.standings, mapGroupEntry)
        };
    }

    const standings = _.get(parsedResponse, ['standings', 0, 'table']);

    return {
        code: competition,
        details: {isCup, matchDay, team: getTeamType(competition)},
        list: _.map(standings, mapStandingEntry)
    };
}

async function fetchScorers(competition) {
    const competitionId = getCompetitionId(competition);

    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/scorers?limit=100`, getRequestOptions());

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
        details: {isCup: isCompetitionTypeCup(competition), team: getTeamType(competition)},
        list: scorers
    };
}

async function fetchMatches(competition, errorReason = FETCHING_SCHEDULES) {
    const competitionId = getCompetitionId(competition);

    const response = await fetch(`${BASE_URL}/competitions/${competitionId}/matches`, getRequestOptions());

    if (!response.ok) {
        const reason = response.status === 429 ? API_LIMIT_REACHED : errorReason;

        throw new SoccerError(reason, {competition, provider: PROVIDER_NAME});
    }

    const {matches: rawMatches = []} = await response.json();

    const matchDay = _.get(rawMatches, [0, 'season', 'currentMatchday'], 1);
    const matches = _.map(rawMatches, mapMatchEntry);
    const {stage} = _.find(matches, {matchDay}) || {};

    return {matches, matchDay, stage};
}

async function fetchSchedules(competition) {
    const {matches, matchDay, stage} = await fetchMatches(competition, FETCHING_SCHEDULES);

    const isCup = isCompetitionTypeCup(competition);

    const matchesOfCurrentMatchDay = _.filter(matches, {matchDay});

    return {
        code: competition,
        details: {isCup, matchDay, stage, team: getTeamType(competition)},
        list: matchesOfCurrentMatchDay
    };
}

function init(providerConfig) {
    config = providerConfig;
}

registerProvider(PROVIDER_NAME, {init, fetchStandings, fetchScorers, fetchSchedules});
