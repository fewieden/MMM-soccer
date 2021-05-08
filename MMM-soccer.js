/**
 * @file MMM-soccer.js
 *
 * @author fewieden
 * @license MIT
 *
 * @see  https://github.com/fewieden/MMM-soccer
 */

/**
 * @external Module
 * @see https://github.com/MichMich/MagicMirror/blob/master/js/module.js
 */

/**
 * @external Log
 * @see https://github.com/MichMich/MagicMirror/blob/master/js/logger.js
 */

/**
 * @module MMM-soccer
 * @description Frontend of the MagicMirror² module.
 *
 * @requires external:Module
 * @requires external:Log
 */
Module.register('MMM-soccer', {
    /**
     * @member {string} requiresVersion - Defines the required minimum version of the MagicMirror framework in order to
     * run this version of the module.
     */
    requiresVersion: '2.14.0',

    /**
     * @member {Object} defaults - Defines the default config values.
     * @property {boolean|string} api_key - API acces key for football-data.org.
     * @property {boolean} colored - Flag to show logos in color or black/white.
     * @property {string} show - Country name (uppercase) to be shown in module.
     * @property {boolean|Object} focus_on - Hash of country name -> club name to determine highlighted team per league.
     * @property {boolean|int} max_teams - Maximium amount of teams to be displayed.
     * @property {boolean} logos - Flag to show club logos.
     * @property {Object} leagues - Hash of country name -> league id.
     */
    defaults: {
        api_key: false,
        colored: false,
        logos: false,
        rotationInterval: 15 * 1000,
        competitions: [
            {
                code: 'BL1',
                type: 'league',
                standings: {
                    provider: 'football-data',
                    focusOn: 'SCF',
                    maxTeams: 5
                }
            },
            {
                code: 'PL',
                type: 'league',
                standings: {
                    provider: 'football-data',
                    focusOn: 'LIV',
                    maxTeams: 7
                }
            }
        ]
    },

    /**
     * @member {Object} voice - Defines the default mode and commands of this module.
     * @property {string} mode - Voice mode of this module.
     * @property {string[]} sentences - List of voice commands of this module.
     */
    voice: {
        mode: 'SOCCER',
        sentences: [
            'OPEN HELP',
            'CLOSE HELP',
            'SHOW STANDINGS OF COUNTRY NAME',
            'EXPAND VIEW',
            'COLLAPSE VIEW'
        ]
    },

    standings: {},
    competitions: {},

    types: ['standings'],

    competitionIndex: 0,
    typeIndex: 0,

    /**
     * @function start
     * @description Adds nunjuck filters and requests for league data.
     * @override
     *
     * @returns {void}
     */
    start() {
        Log.info(`Starting module: ${this.name}`);
        this.addFilters();
        this.scheduleCarousel();
        this.sendSocketNotification('CONFIG', this.config);
    },

    /**
     * @function socketNotificationReceived
     * @description Handles incoming messages from node_helper.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     */
    socketNotificationReceived(notification, payload) {
        if (notification === 'standings') {
            this.standings = payload;
        }

        this.updateDom(0);
    },

    /**
     * @function notificationReceived
     * @description Handles incoming broadcasts from other modules or the MagicMirror² core.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     * @param {Object} sender - Module that sent the notification or undefined for MagicMirror² core.
     */
    notificationReceived(notification, payload, sender) {
        if (notification === 'ALL_MODULES_STARTED') {
            const competitions = this.config.competitions.map(competition => competition.code).join(' ');
            this.sendNotification('REGISTER_VOICE_MODULE', {
                mode: this.voice.mode,
                sentences: [...this.voice.sentences, competitions]
            });
        } else if (notification === 'VOICE_SOCCER' && sender.name === 'MMM-voice') {
            this.executeVoiceCommands(payload);
        } else if (notification === 'VOICE_MODE_CHANGED' && sender.name === 'MMM-voice'
            && payload.old === this.voice.mode) {
            this.sendNotification('CLOSE_MODAL');
        }
    },

    /**
     * @function getStyles
     * @description Style dependencies for this module.
     * @override
     *
     * @returns {string[]} List of the style dependency filepaths.
     */
    getStyles() {
        return ['font-awesome.css', 'MMM-soccer.css'];
    },

    /**
     * @function getTranslations
     * @description Translations for this module.
     * @override
     *
     * @returns {Object.<string, string>} Available translations for this module (key: language code, value: filepath).
     */
    getTranslations() {
        return {
            en: 'translations/en.json',
            de: 'translations/de.json',
            fr: 'translations/fr.json',
            id: 'translations/id.json',
            sv: 'translations/sv.json'
        };
    },

    /**
     * @function getTemplate
     * @description Nunjuck template.
     * @override
     *
     * @returns {string} Path to nunjuck template.
     */
    getTemplate() {
        return 'templates/MMM-soccer.njk';
    },

    /**
     * @function getTemplateData
     * @description Data that gets rendered in the nunjuck template.
     * @override
     *
     * @returns {string} Data for the nunjuck template.
     */
    getTemplateData() {
        const code = this.config.competitions[this.competitionIndex].code;

        return {
            boundaries: this.calculateTeamDisplayBoundaries(),
            competition: code,
            config: this.config,
            matchDayNumber: this.season?.currentMatchday || 'N/A',
            standing: this.standings[code]
        };
    },

    /**
     * @function handleHelpModal
     * @description Opens/closes help modal based on voice commands.
     *
     * @param {string} data - Text with commands.
     *
     * @returns {void}
     */
    handleHelpModal(data) {
        if (/(CLOSE)/g.test(data) && !/(OPEN)/g.test(data)) {
            this.sendNotification('CLOSE_MODAL');
        } else if (/(OPEN)/g.test(data) && !/(CLOSE)/g.test(data)) {
            this.sendNotification('OPEN_MODAL', {
                template: 'templates/HelpModal.njk',
                data: {
                    ...this.voice,
                    fns: {
                        translate: this.translate.bind(this)
                    }
                }
            });
        }
    },

    /**
     * @function handleStandingsModal
     * @description Opens/closes standing modal based on voice commands.
     *
     * @param {string} data - Text with commands.
     *
     * @returns {void}
     */
    handleStandingsModal(data) {
        if (/(COLLAPSE)/g.test(data) && !/(EXPAND)/g.test(data)) {
            this.sendNotification('CLOSE_MODAL');
        } else if (/(EXPAND)/g.test(data) && !/(COLLAPSE)/g.test(data)) {
            this.sendNotification('OPEN_MODAL', {
                template: 'templates/StandingsModal.njk',
                data: {
                    ...this.getTemplateData(),
                    fns: {
                        translate: this.translate.bind(this)
                    }
                }
            });
        }
    },

    /**
     * @function handleLeagueSwitch
     * @description Sitches the soccer league based on voice commands.
     *
     * @param {string} data - Text with commands.
     *
     * @returns {void}
     */
    handleLeagueSwitch(data) {
        const countries = Object.keys(this.config.leagues);

        for (const country of countries) {
            const regexp = new RegExp(country, 'g');

            if (regexp.test(data)) {
                this.sendNotification('CLOSE_MODAL');

                if (this.currentLeague !== this.config.leagues[country]) {
                    this.currentLeague = this.config.leagues[country];
                    this.getData();
                }

                break;
            }
        }

        this.updateDom(300);
    },

    /**
     * @function executeVoiceCommands
     * @description Executes the voice commands.
     *
     * @param {string} data - Text with commands.
     *
     * @returns {void}
     */
    executeVoiceCommands(data) {
        if (/(HELP)/g.test(data)) {
            this.handleHelpModal(data);
        } else if (/(VIEW)/g.test(data)) {
            this.handleStandingsModal(data);
        } else if (/(STANDINGS)/g.test(data)) {
            this.handleLeagueSwitch(data);
        }
    },

    /**
     * @function getMaxTeams
     * @description Are there less entries than the config option specifies.
     *
     * @returns {number} Amount of teams to display
     */
    getMaxTeams() {
        const code = this.config.competitions[this.competitionIndex].code;
        const competition = this.getCurrentCompetitionConfig();

        if (competition.maxTeams) {
            return Math.min(Math.max(competition.maxTeams, 0), this.standings[code]?.length);
        }

        return this.standings[code]?.length;
    },

    /**
     * @function findFocusTeam
     * @description Helper function to find index of team in standings
     *
     * @returns {Object} Index of team, first and last team to display. focusTeamIndex is -1 if it can't be found.
     */
    findFocusTeam() {
        const code = this.config.competitions[this.competitionIndex].code;
        const competition = this.getCurrentCompetitionConfig();
        let focusTeamIndex = -1;

        for (let i = 0; i < this.standings[code]?.length; i += 1) {
            if (this.standings[code][i].team === competition.focusOn) {
                focusTeamIndex = i;
                break;
            }
        }

        const {firstTeam, lastTeam} = this.getFirstAndLastTeam(focusTeamIndex);

        return {focusTeamIndex, firstTeam, lastTeam};
    },

    /**
     * @function getFirstAndLastTeam
     * @description Helper function to get the boundaries of the teams that should be displayed.
     *
     * @param {number} index - Index of the focus_on team.
     *
     * @returns {Object} Index of the first and the last team.
     */
    getFirstAndLastTeam(index) {
        const code = this.config.competitions[this.competitionIndex].code;

        let firstTeam = 0;
        let lastTeam = this.standings[code]?.length - 1;

        const competition = this.getCurrentCompetitionConfig();

        if (competition.maxTeams) {
            const before = parseInt(competition.maxTeams / 2);
            const indexDiff = competition.maxTeams - 1;
            firstTeam = Math.max(index - before, 0);
            if (firstTeam + indexDiff < this.standings[code]?.length) {
                lastTeam = firstTeam + indexDiff;
            } else {
                firstTeam = Math.max(lastTeam - indexDiff, 0);
            }
        }

        return {firstTeam, lastTeam};
    },

    /**
     * @function calculateTeamDisplayBoundaries
     * @description Calculates the boundaries of teams based on the config.
     *
     * @returns {Object} Index of team, first and last team to display.
     */
    calculateTeamDisplayBoundaries() {
        const competition = this.getCurrentCompetitionConfig();

        if (competition.focusOn) {
            if (competition.focusOn === 'TOP') {
                return {
                    focusTeamIndex: -1,
                    firstTeam: 0,
                    lastTeam: this.getMaxTeams() - 1
                };
            } else if (competition.focusOn === 'BOTTOM') {
                const code = this.config.competitions[this.competitionIndex].code;

                return {
                    focusTeamIndex: -1,
                    firstTeam: this.standings[code]?.length - this.getMaxTeams(),
                    lastTeam: this.standings[code]?.length - 1
                };
            }
        }

        return this.findFocusTeam();
    },

    getCurrentCompetitionConfig() {
        return this.config.competitions[this.competitionIndex][this.types[this.typeIndex]];
    },

    getNextTypeIndex(shift) {
        const currentIndex = this.typeIndex + (shift ? 1 : 0);

        for (let i = currentIndex; i <= this.types.length; i++) {
            if (this.config.competitions[this.competitionIndex][this.types[i]]) {
                return i;
            }
        }

        return 0;
    },

    scheduleCarousel() {
        setInterval(() => {
            this.typeIndex = this.getNextTypeIndex(true);

            if (this.typeIndex !== 0) {
                return this.updateDom(300);
            }

            this.competitionIndex++;

            if (this.competitionIndex >= this.config.competitions.length) {
                this.competitionIndex = 0;
            }

            this.typeIndex = this.getNextTypeIndex(false);

            return this.updateDom(300);
        }, this.config.rotationInterval);
    },

    /**
     * @function addFilters
     * @description Adds the filter used by the nunjuck template.
     *
     * @returns {void}
     */
    addFilters() {
        this.nunjucksEnvironment().addFilter('fade', (index, focus) => {
            const competition = this.getCurrentCompetitionConfig();

            if (competition.maxTeams && focus >= 0) {
                if (index !== focus) {
                    const currentStep = Math.abs(index - focus);
                    const percentage = (1 - 1 / competition.maxTeams * currentStep).toFixed(2);

                    return `opacity: ${percentage}`;
                }
            }

            return '';
        });
    }
});
