const _ = require('lodash');

const {SUPPORTED_COMPETITIONS, POINT_RELATED_STATUSES} = require('./constants');

function initStatsByGroup(matchesByGroup) {
    let statsByGroup = {};

    for (const group in matchesByGroup) {
        const groupMatches = matchesByGroup[group];

        for (const match of groupMatches) {
            _.set(statsByGroup, [group, match.homeTeam], {
                team: match.homeTeam,
                logo: match.homeLogo,
                goalsScored: 0,
                goalsAgainst: 0,
                points: 0,
                playedGames: 0
            });

            _.set(statsByGroup, [group, match.awayTeam], {
                team: match.awayTeam,
                logo: match.awayLogo,
                goalsScored: 0,
                goalsAgainst: 0,
                points: 0,
                playedGames: 0
            });
        }
    }

    return statsByGroup;
}

function computeStats(matchesByGroup, statsByGroup) {
    for (const group in matchesByGroup) {
        const groupMatches = matchesByGroup[group];

        for (const match of groupMatches) {
            if (!POINT_RELATED_STATUSES.includes(match.status)) {
                continue;
            }

            statsByGroup[group][match.homeTeam].goalsScored += match.homeScore;
            statsByGroup[group][match.awayTeam].goalsScored += match.awayScore;

            statsByGroup[group][match.homeTeam].goalsAgainst += match.awayScore;
            statsByGroup[group][match.awayTeam].goalsAgainst += match.homeScore;

            statsByGroup[group][match.homeTeam].playedGames += 1;
            statsByGroup[group][match.awayTeam].playedGames += 1;

            if (match.homeScore === match.awayScore) {
                statsByGroup[group][match.homeTeam].points += 1;
                statsByGroup[group][match.awayTeam].points += 1;
            } else if (match.homeScore > match.awayScore) {
                statsByGroup[group][match.homeTeam].points += 3;
            } else {
                statsByGroup[group][match.awayTeam].points += 3;
            }
        }
    }

    return statsByGroup;
}

function compareTeamsByAwayGoals(teams, matches) {
    let bestTeam;

    const awayGoals = _.map(teams, team => {
        let awayScores = 0;

        for (const match of matches) {
            if (match.awayTeam === team) {
                awayScores += match.awayScore;
            }
        }

        return {team, awayScores};
    });

    const orderedByAwayGoals = _.orderBy(awayGoals, 'awayScores', 'desc');

    if (orderedByAwayGoals[0].awayScores !== orderedByAwayGoals[1].awayScores) {
        bestTeam = orderedByAwayGoals[0].team;
    }

    return bestTeam || teams[0];
}

function compareTeamsByGoalsScored(teams, matches) {
    let bestTeam;

    const scoredGoals = _.map(teams, team => {
        let allScores = 0;

        for (const match of matches) {
            allScores += match.homeTeam === team ? match.homeScore : match.awayScore;
        }

        return {team, allScores};
    });

    const orderedByAllScores = _.orderBy(scoredGoals, 'allScores', 'desc');

    if (orderedByAllScores[0].allScores !== orderedByAllScores[1].allScores) {
        bestTeam = orderedByAllScores[0].team;
    }

    return bestTeam || compareTeamsByAwayGoals(teams, matches);
}

function compareTeamsByGoalDifference(teams, matches) {
    let bestTeam;

    const goalDifferences = _.map(teams, team => {
        let goalDifference = 0;

        for (const match of matches) {
            if (match.homeTeam === team) {
                goalDifference += match.homeScore - match.awayScore;
            } else {
                goalDifference += match.awayScore - match.homeScore;
            }
        }

        return {team, goalDifference};
    });

    const orderedByGoalDifference = _.orderBy(goalDifferences, 'goalDifference', 'desc');

    if (orderedByGoalDifference[0].goalDifference !== orderedByGoalDifference[1].goalDifference) {
        bestTeam = orderedByGoalDifference[0].team;
    }

    return bestTeam || compareTeamsByGoalsScored(teams, matches);
}

function compareTeamsByPoints(teams, matches) {
    let bestTeam;

    const obtainedPoints = _.map(teams, team => {
        let points = 0;

        for (const match of matches) {
            if (match.homeScore === match.awayScore) {
                points += 1;
            } else if (match.homeScore > match.awayScore && match.homeTeam === team || match.awayScore > match.homeScore && match.awayTeam === team) {
                points += 3;
            }
        }

        return {team, points};
    });

    const orderedByPoints = _.orderBy(obtainedPoints, 'points', 'desc');

    if (orderedByPoints[0].points !== orderedByPoints[1].points) {
        bestTeam = orderedByPoints[0].team;
    }

    return bestTeam || compareTeamsByGoalDifference(teams, matches);
}

function getBestTeamName(entries, groupMatches) {
    const teams = _.map(entries, 'team');

    const matches = _.filter(groupMatches, match => teams.includes(match.homeTeam) && teams.includes(match.awayTeam));

    return compareTeamsByPoints(teams, matches);
}

function computePositionsForPositionDraw(standing, rest, groupMatches) {
    let entriesToCompare = [rest[0]];
    let newRest = [];

    for (let i = 1; i < rest.length; i++) {
        if (rest[0].points === rest[i].points) {
            entriesToCompare.push(rest[i]);
        } else {
            newRest.push(rest[i]);
        }
    }

    const bestTeamName = getBestTeamName(entriesToCompare, groupMatches);
    const teamIndex = _.findIndex(entriesToCompare, {team: bestTeamName});
    const bestTeams = _.pullAt(entriesToCompare, teamIndex);

    standing.push({...bestTeams[0], position: standing.length + 1});

    return computePositionsForGroupRest(standing, [...entriesToCompare, ...newRest], groupMatches);
}

function computePositionsForGroupRest(standing, rest, groupMatches) {
    if (rest.length === 0) {
        return standing;
    } else if (rest.length === 1) {
        standing.push({...rest[0], position: standing.length + 1});

        return standing;
    } else if (rest[0].points > rest[1].points) {
        const [entry, ...newRest] = rest;
        standing.push({...entry, position: standing.length + 1});

        return computePositionsForGroupRest(standing, newRest, groupMatches);
    }

    return computePositionsForPositionDraw(standing, rest, groupMatches);
}

function getStandingsWithPositions(statsByGroup, matchesByGroup) {
    const standings = [];

    for (const group in statsByGroup) {
        let groupStanding = _.values(statsByGroup[group]);
        groupStanding = _.orderBy(groupStanding, 'points', 'desc');
        standings.push({
            details: {group},
            list: computePositionsForGroupRest([], groupStanding, matchesByGroup[group])
        });
    }

    return standings;
}

function computeGroupStandings(matches) {
    const groupStageMatches = _.sortBy(_.filter(matches, {stage: 'GROUP_STAGE'}), 'group');
    const matchesByGroup = _.groupBy(groupStageMatches, 'group');

    let statsByGroup = initStatsByGroup(matchesByGroup);
    statsByGroup = computeStats(matchesByGroup, statsByGroup);

    return getStandingsWithPositions(statsByGroup, matchesByGroup);
}

module.exports = {computeGroupStandings};
