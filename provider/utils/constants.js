const DATA_TYPES = ['standings', 'scorers'];

const SUPPORTED_COMPETITIONS = {
    BL1: {type: 'league'},
    PL: {type: 'league'},
    SA: {type: 'league'},
    FL1: {type: 'league'},
    PD: {type: 'league'},
    PPL: {type: 'league'},
    DED: {type: 'league'},
    BSA: {type: 'league'},
    CL: {type: 'cup'},
    EC: {type: 'cup'},
    ELC: {type: 'cup'},
    WC: {type: 'cup'}
};

const POINT_RELATED_STATUSES = ['IN_PLAY', 'PAUSED', 'FINISHED', 'AWARDED'];

module.exports = {DATA_TYPES, SUPPORTED_COMPETITIONS, POINT_RELATED_STATUSES};
