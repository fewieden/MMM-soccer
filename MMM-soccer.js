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
        show: 'GERMANY',
        focus_on: false,
        max_teams: false,
        logos: false,
        leagues: {
            GERMANY: 'BL1',
            FRANCE: 'FL1',
            ENGLAND: 'PL',
            SPAIN: 'PD',
            ITALY: 'SA'
        }
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

    /**
     * @member {boolean} loading - Flag to indicate the loading state of the module.
     */
    loading: true,
    /**
     * @member {Object[]} standing - Stores the list of standing table entries of current selected league.
     */
    standing: [],
    /**
     * @member {Object} competition - Details about the current selected league.
     */
    competition: {},

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
        this.currentLeague = this.config.leagues[this.config.show];
        this.getData();
        setInterval(() => {
            this.getData();
        }, this.config.api_key ? 300000 : 1800000); // with api_key every 5min without every 30min
    },

    /**
     * @function getData
     * @description Sends request to the node_helper to fetch data for the current selected league.
     *
     * @returns {void}
     */
    getData() {
        this.sendSocketNotification('GET_DATA', { league: this.currentLeague, api_key: this.config.api_key });
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
        if (notification === 'DATA') {
            this.standing = payload.standings[0].table;
            this.season = payload.season;
            this.competition = payload.competition;
            this.loading = false;
            this.updateDom(300);
        }
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
            const leagues = Object.keys(this.config.leagues).join(' ');
            this.sendNotification('REGISTER_VOICE_MODULE', {
                mode: this.voice.mode,
                sentences: [...this.voice.sentences, leagues]
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
        return {
            boundaries: this.calculateTeamDisplayBoundaries(),
            competitionName: this.competition.name || this.name,
            config: this.config,
            matchDayNumber: this.season ? this.season.currentMatchday : 'N/A',
            standing: this.standing,
            loading: this.loading
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
        const countrys = Object.keys(this.config.leagues);

        for (let i = 0; i < countrys.length; i += 1) {
            const regexp = new RegExp(countrys[i], 'g');

            if (regexp.test(data)) {
                this.sendNotification('CLOSE_MODAL');

                if (this.currentLeague !== this.config.leagues[countrys[i]]) {
                    this.currentLeague = this.config.leagues[countrys[i]];
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
     * @function isMaxTeamsLessAll
     * @description Are there more entries than the config option specifies.
     *
     * @returns {boolean} Is max teams less than all teams?
     */
    isMaxTeamsLessAll() {
        return this.config.max_teams && this.config.max_teams <= this.standing.length;
    },

    /**
     * @function findFocusTeam
     * @description Helper function to find index of team in standings
     *
     * @returns {Object} Index of team, first and last team to display.
     */
    findFocusTeam() {
        let focusTeamIndex;

        for (let i = 0; i < this.standing.length; i += 1) {
            if (this.standing[i].team.name === this.config.focus_on[this.config.show]) {
                focusTeamIndex = i;
                break;
            }
        }

        const { firstTeam, lastTeam } = this.getFirstAndLastTeam(focusTeamIndex);

        return { focusTeamIndex, firstTeam, lastTeam };
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
        let firstTeam;
        let lastTeam;

        if (this.config.max_teams) {
            const before = parseInt(this.config.max_teams / 2);
            firstTeam = index - before >= 0 ? index - before : 0;
            if (firstTeam + this.config.max_teams <= this.standing.length) {
                lastTeam = firstTeam + this.config.max_teams;
            } else {
                lastTeam = this.standing.length;
                firstTeam = lastTeam - this.config.max_teams >= 0
                    ? lastTeam - this.config.max_teams : 0;
            }
        } else {
            firstTeam = 0;
            lastTeam = this.standing.length;
        }

        return { firstTeam, lastTeam };
    },

    /**
     * @function calculateTeamDisplayBoundaries
     * @description Calculates the boundaries of teams based on the config.
     *
     * @returns {Object} Index of team, first and last team to display.
     */
    calculateTeamDisplayBoundaries() {
        if (this.config.focus_on && Object.prototype.hasOwnProperty.call(this.config.focus_on, this.config.show)) {
            if (this.config.focus_on[this.config.show] === 'TOP') {
                return {
                    focusTeamIndex: -1,
                    firstTeam: 0,
                    lastTeam: this.isMaxTeamsLessAll() ? this.config.max_teams : this.standing.length
                };
            } else if (this.config.focus_on[this.config.show] === 'BOTTOM') {
                return {
                    focusTeamIndex: -1,
                    firstTeam: this.isMaxTeamsLessAll() ? this.standing.length - this.config.max_teams : 0,
                    lastTeam: this.standing.length
                };
            }

            return this.findFocusTeam();
        }

        return {
            focusTeamIndex: -1,
            firstTeam: 0,
            lastTeam: this.config.max_teams || this.standing.length
        };
    },

    /**
     * @function addFilters
     * @description Adds the filter used by the nunjuck template.
     *
     * @returns {void}
     */
    addFilters() {
        this.nunjucksEnvironment().addFilter('fade', (index, focus) => {
            if (this.config.max_teams && focus >= 0) {
                if (index !== focus) {
                    const currentStep = Math.abs(index - focus);
                    return `opacity: ${1 - 1 / this.config.max_teams * currentStep}`;
                }
            }

            return '';
        });
    }
});
