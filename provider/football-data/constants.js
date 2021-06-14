const BASE_URL = 'https://api.football-data.org/v2';

const PROVIDER_NAME = 'football-data';

const POINT_RELATED_STATUSES = ['IN_PLAY', 'PAUSED', 'FINISHED', 'AWARDED'];

const COMPETITIONS = {
    BL1: 'BL1',
    PL: 'PL',
    SA: 'SA',
    FL1: 'FL1',
    PD: 'PD',
    PPL: 'PPL',
    DED: 'DED',
    BSA: 'BSA',
    CL: 'CL',
    EC: 'EC',
    ELC: 'ELC',
    WC: 'WC'
};

module.exports = {BASE_URL, PROVIDER_NAME, COMPETITIONS, POINT_RELATED_STATUSES};
