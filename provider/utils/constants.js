const DATA_TYPES = ['standings', 'schedules', 'scorers'];

const DEFAULT_COMPETITION_TYPE = 'league';
const DEFAULT_TEAM_TYPE = 'club';

const SUPPORTED_COMPETITIONS = {
    BL1: {},
    PL: {},
    SA: {},
    FL1: {},
    PD: {},
    PPL: {},
    DED: {},
    BSA: {},
    CL: {type: 'cup'},
    EC: {type: 'cup', team: 'country'},
    ELC: {type: 'cup'},
    WC: {type: 'cup', team: 'country'}
};

const POINT_RELATED_STATUSES = ['IN_PLAY', 'PAUSED', 'FINISHED', 'AWARDED'];

module.exports = {DATA_TYPES, DEFAULT_COMPETITION_TYPE, DEFAULT_TEAM_TYPE, SUPPORTED_COMPETITIONS, POINT_RELATED_STATUSES};
