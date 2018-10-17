const fs = require('fs');
const path = require('path');
const request = require('request');

const leagues = {
    GERMANY: 452,
    FRANCE: 450,
    ENGLAND: 445,
    SPAIN: 455,
    ITALY: 456
};

if (process.argv.length <= 2) {
    throw new Error('You need to specify a country name!');
}

const country = process.argv[2].toUpperCase();

if (!Object.prototype.hasOwnProperty.call(leagues, country)) {
    throw new Error('Selected country is not supported!');
}

const options = {
    url: `http://api.football-data.org/v1/competitions/${leagues[country]}/leagueTable`
};

const missingTeams = {
    GERMANY: ['1. FC Nürnberg', 'TSV Fortuna 95 Düsseldorf'],
    FRANCE: ['En Avant Guingamp', 'Nîmes Olympique', 'Stade de Reims'],
    ENGLAND: ['Cardiff City FC', 'Fulham FC', 'Wolverhampton Wanderers FC'],
    SPAIN: ['Rayo Vallecano de Madrid', 'Real Valladolid CF', 'SD Huesca'],
    ITALY: ['Empoli FC', 'Frosinone Calcio', 'Parma Calcio 1913']
};

function extendTeams(teams) {
    missingTeams[country].forEach((name) => {
        teams.push({ teamName: name });
    });
}

const iconFixes = {
    // Germany
    '1. FC Nürnberg': 'https://upload.wikimedia.org/wikipedia/commons/5/56/FC_N%C3%BCrnberg.svg',
    'Bor. Mönchengladbach': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg',
    'FC Bayern München': 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Logo_FC_Bayern_M%C3%BCnchen_%282002%E2%80%932017%29.svg',
    'TSV Fortuna 95 Düsseldorf': 'https://upload.wikimedia.org/wikipedia/commons/9/94/Fortuna_D%C3%BCsseldorf.svg',
    // France
    'En Avant Guingamp': 'https://vignette.wikia.nocookie.net/logopedia/images/9/99/En_Avant_de_Guingamp_logo.svg',
    'Nîmes Olympique': 'https://upload.wikimedia.org/wikipedia/fr/f/f0/N%C3%AEmes_Olympique_logo_2018.svg',
    'OGC Nice': 'https://upload.wikimedia.org/wikipedia/de/5/58/OGC_Nizza_Logo.svg',
    'OSC Lille': 'https://vignette.wikia.nocookie.net/logopedia/images/a/ab/Lille_OSC_logo.svg',
    'SM Caen': 'https://upload.wikimedia.org/wikipedia/commons/6/64/SM_Caen.svg',
    'Stade de Reims': 'https://upload.wikimedia.org/wikipedia/de/9/9e/Stade_Reims_Logo.svg',
    // England
    'Burnley FC': 'https://upload.wikimedia.org/wikipedia/de/4/49/FC_Burnley.svg',
    'Cardiff City FC': 'https://upload.wikimedia.org/wikipedia/de/1/18/Cardiff_City_AFC.svg',
    'Crystal Palace FC': 'https://upload.wikimedia.org/wikipedia/de/f/fc/Crystal_Palace_FC.svg',
    'Fulham FC': 'https://upload.wikimedia.org/wikipedia/de/a/a8/Fulham_fc.svg',
    'Leicester City FC': 'https://upload.wikimedia.org/wikipedia/de/b/b6/Leicester_City.svg',
    'Wolverhampton Wanderers FC': 'https://upload.wikimedia.org/wikipedia/de/1/1d/Wolverhampton_wanderers.svg',
    // Spain
    'CD Leganes': 'https://svgur.com/i/890.svg',
    'Málaga CF': 'https://upload.wikimedia.org/wikipedia/de/e/e8/FC_M%C3%A1laga.svg',
    'Rayo Vallecano de Madrid': 'https://upload.wikimedia.org/wikipedia/de/1/12/Rayo_vallecano_madrid.svg',
    'RC Deportivo La Coruna': 'https://upload.wikimedia.org/wikipedia/de/b/b9/Deportivo_La_Coruna.svg',
    'Real Sociedad de Fútbol': 'https://upload.wikimedia.org/wikipedia/de/5/55/Real_Sociedad_San_Sebasti%C3%A1n.svg',
    'Real Valladolid CF': 'https://upload.wikimedia.org/wikipedia/de/6/6e/Real_Valladolid_Logo.svg',
    'SD Huesca': 'https://upload.wikimedia.org/wikipedia/de/7/71/SD_Huesca.svg',
    'Sevilla FC': 'https://upload.wikimedia.org/wikipedia/de/c/c0/FC_Sevilla.svg',
    // Italy
    'Benevento Calcio': 'https://upload.wikimedia.org/wikipedia/de/4/48/Benevento_Calcio_Logo.svg',
    'Empoli FC': 'https://upload.wikimedia.org/wikipedia/de/4/42/Logo_FC_Empoli.svg',
    'FC Internazionale Milano': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Inter_Mailand.svg',
    'Frosinone Calcio': 'https://upload.wikimedia.org/wikipedia/de/2/2b/Frosinone_Calcio.svg',
    'Parma Calcio 1913': 'https://upload.wikimedia.org/wikipedia/de/e/e2/FC_Parma.svg',
    'SPAL Ferrara': 'https://upload.wikimedia.org/wikipedia/de/e/e7/SPAL_Ferrara.svg',
    'SS Lazio': 'https://upload.wikimedia.org/wikipedia/sco/e/e4/SS_Lazio.svg',
    'UC Sampdoria': 'https://upload.wikimedia.org/wikipedia/ro/c/c4/UC_Sampdoria.svg'
};

const renamedTeams = {
    // Germany
    'Bayer Leverkusen': 'Bayer 04 Leverkusen',
    'Borussia Dortmund': 'BV Borussia 09 Dortmund',
    'Bor. Mönchengladbach': 'Borussia Mönchengladbach',
    'Red Bull Leipzig': 'RB Leipzig',
    'Werder Bremen': 'SV Werder Bremen',
    // France
    'Dijon FCO': 'Dijon Football Côte d\'Or',
    'Montpellier Hérault SC': 'Montpellier HSC',
    'OGC Nice': 'OGC de Nice Côte d\'Azur',
    'OSC Lille': 'Lille OSC',
    'Paris Saint-Germain': 'Paris Saint-Germain FC',
    'Stade Rennais FC': 'Stade Rennais FC 1901',
    // England
    'Brighton & Hove Albion': 'Brighton & Hove Albion FC',
    'Huddersfield Town': 'Huddersfield Town AFC',
    // Spain,
    'RCD Espanyol': 'RCD Espanyol de Barcelona',
    'Real Betis': 'Real Betis Balompié',
    // Italy
    'Bologna FC': 'Bologna FC 1909',
    'Juventus Turin': 'Juventus FC',
    'SPAL Ferrara': 'SPAL 2013'
};

function download(uri, team, callback) {
    const filename = path.join(__dirname, '..', 'public', `${Object.prototype.hasOwnProperty.call(renamedTeams, team) ? renamedTeams[team] : team}.svg`);
    request(Object.prototype.hasOwnProperty.call(iconFixes, team) ? iconFixes[team] : uri)
        .pipe(fs.createWriteStream(filename))
        .on('close', () => callback(team));
}

let iconsCount = 0;

function counter(team) {
    iconsCount -= 1;
    console.log(`Downloaded: ${team}`); // eslint-disable-line no-console

    if (iconsCount <= 0) {
        console.log('All icons downloaded'); // eslint-disable-line no-console
        process.exit(1);
    }
}

request(options, (error, response, body) => {
    if (response.statusCode === 200) {
        const parsedBody = JSON.parse(body);
        extendTeams(parsedBody.standing);
        iconsCount = parsedBody.standing.length;

        parsedBody.standing.forEach(({ teamName, crestURI }) => {
            const uri = Object.prototype.hasOwnProperty.call(iconFixes, teamName) ? iconFixes[teamName] : crestURI;
            download(uri, teamName, counter);
        });
    }
});
