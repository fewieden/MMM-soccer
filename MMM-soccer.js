/**
 * @file MMM-soccer.js
 *
 * @author fewieden
 * @license MIT
 *
 * @see  https://github.com/fewieden/MMM-soccer
 */

/* global Module Log */

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
     * @member {Object} modals - Stores the status of the module's modals.
     * @property {boolean} standings - Full standings table.
     * @property {boolean} help - List of voice commands of this module.
     */
    modals: {
        standings: false,
        help: false
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
     * @function start
     * @description Sends request to the node_helper to fetch data for the current selected league.
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
            this.updateDom();
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
            const voice = Object.assign({}, this.voice);
            voice.sentences.push(Object.keys(this.config.leagues).join(' '));
            this.sendNotification('REGISTER_VOICE_MODULE', voice);
        } else if (notification === 'VOICE_SOCCER' && sender.name === 'MMM-voice') {
            this.checkCommands(payload);
        } else if (notification === 'VOICE_MODE_CHANGED' && sender.name === 'MMM-voice'
            && payload.old === this.voice.mode) {
            this.closeAllModals();
            this.updateDom(300);
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
        return 'MMM-soccer.njk';
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
            isModalActive: this.isModalActive(),
            modals: this.modals,
            season: this.season ?
                `${this.translate('MATCHDAY')}: ${this.season.currentMatchday || 'N/A'}` : this.translate('LOADING'),
            standing: this.standing,
            voice: this.voice
        };
    },

    /**
     * @function handleModals
     * @description Hide/show modules based on voice commands.
     */
    handleModals(data, modal, open, close) {
        if (close.test(data) || (this.modals[modal] && !open.test(data))) {
            this.closeAllModals();
        } else if (open.test(data) || (!this.modals[modal] && !close.test(data))) {
            this.closeAllModals();
            this.modals[modal] = true;
        }

        const modules = document.querySelectorAll('.module');
        for (let i = 0; i < modules.length; i += 1) {
            if (!modules[i].classList.contains('MMM-soccer')) {
                if (this.isModalActive()) {
                    modules[i].classList.add('MMM-soccer-blur');
                } else {
                    modules[i].classList.remove('MMM-soccer-blur');
                }
            }
        }
    },

    /**
     * @function closeAllModals
     * @description Close all modals of the module.
     */
    closeAllModals() {
        const modals = Object.keys(this.modals);
        modals.forEach((modal) => { this.modals[modal] = false; });
    },

    /**
     * @function isModalActive
     * @description Checks if at least one modal is active.
     *
     * @returns {boolean} Flag if there is an active modal.
     */
    isModalActive() {
        const modals = Object.keys(this.modals);
        return modals.some(modal => this.modals[modal] === true);
    },

    /**
     * @function checkCommands
     * @description Voice command handler.
     */
    checkCommands(data) {
        if (/(HELP)/g.test(data)) {
            this.handleModals(data, 'help', /(OPEN)/g, /(CLOSE)/g);
        } else if (/(VIEW)/g.test(data)) {
            this.handleModals(data, 'standings', /(EXPAND)/g, /(COLLAPSE)/g);
        } else if (/(STANDINGS)/g.test(data)) {
            const countrys = Object.keys(this.config.leagues);
            for (let i = 0; i < countrys.length; i += 1) {
                const regexp = new RegExp(countrys[i], 'g');
                if (regexp.test(data)) {
                    this.closeAllModals();
                    if (this.currentLeague !== this.config.leagues[countrys[i]]) {
                        this.currentLeague = this.config.leagues[countrys[i]];
                        this.getData();
                    }
                    break;
                }
            }
        }
        this.updateDom(300);
    },

    /**
     * @function isMaxTeamsLessAll
     * @description Are there more entries than the config option specifies.
     *
     * @returns {boolean}
     */
    isMaxTeamsLessAll() {
        return (this.config.max_teams && this.config.max_teams <= this.standing.length);
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
                firstTeam = lastTeam - this.config.max_teams >= 0 ?
                    lastTeam - this.config.max_teams : 0;
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
     */
    addFilters() {
        this.nunjucksEnvironment().addFilter('fade', (index, focus) => {
            if (this.config.max_teams && focus >= 0) {
                if (index !== focus) {
                    const currentStep = Math.abs(index - focus);
                    return `opacity: ${1 - ((1 / this.config.max_teams) * currentStep)}`;
                }
            }

            return '';
        });
    }
});
