const _ = require('lodash');

const {DEFAULT_COMPETITION_TYPE, DEFAULT_TEAM_TYPE, SUPPORTED_COMPETITIONS} = require('./constants');

function getCompetitionType(competition) {
    return _.get(SUPPORTED_COMPETITIONS, [competition, 'type'], DEFAULT_COMPETITION_TYPE);
}

function getTeamType(competition) {
    return _.get(SUPPORTED_COMPETITIONS, [competition, 'team'], DEFAULT_TEAM_TYPE);
}

function isCompetitionTypeCup(competition) {
    return getCompetitionType(competition) === 'cup';
}

module.exports = {getCompetitionType, getTeamType, isCompetitionTypeCup};
