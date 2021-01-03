function generateResponse() {
    return {
        season: {
            id: 599,
            currentMatchday: 14,
            startDate: '2020-09-18',
            endDate: '2021-05-15'
        },
        competition: {
            id: 2002,
            area: {id: 2088, name: 'Germany'},
            code: 'BL1',
            name: 'Bundesliga',
            plan: 'TIER_ONE',
            lastUpdated: '2021-01-03T01:25:08Z'
        },
        standings: [
            {
                stage: 'REGULAR_SEASON',
                table: [
                    {
                        position: 1,
                        team: {id: 721, name: 'RB Leipzig', crestUrl: 'https://crests.football-data.org/721.svg'},
                        playedGames: 14,
                        points: 31,
                        won: 9,
                        draw: 4,
                        lost: 1,
                        goalsFor: 25,
                        goalsAgainst: 9,
                        goalDifference: 16,
                        form: 'W,D,W,W,D'
                    },
                    {
                        position: 2,
                        team: {id: 5, name: 'FC Bayern München', crestUrl: 'https://crests.football-data.org/5.svg'},
                        playedGames: 13,
                        points: 30,
                        won: 9,
                        draw: 3,
                        lost: 1,
                        goalsFor: 39,
                        goalsAgainst: 19,
                        goalDifference: 20,
                        form: 'W,W,D,D,W'
                    },
                    {
                        position: 3,
                        team: {id: 3, name: 'Bayer 04 Leverkusen', crestUrl: 'https://crests.football-data.org/3.svg'},
                        playedGames: 14,
                        points: 28,
                        won: 8,
                        draw: 4,
                        lost: 2,
                        goalsFor: 29,
                        goalsAgainst: 14,
                        goalDifference: 15,
                        form: 'L,L,W,W,W'
                    }
                ],
                type: 'TOTAL'
            }
        ]
    };
}

module.exports = {generateResponse};
