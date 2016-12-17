/* Magic Mirror
 * Module: MMM-soccer
 *
 * By fewieden https://github.com/fewieden/MMM-soccer
 *
 * MIT Licensed.
 */

Module.register("MMM-soccer",{

    icon_fixes: {
        "1. FC Köln": "http://vignette1.wikia.nocookie.net/fusssballstatistiken/images/a/aa/1_FC_Koeln.svg",
        "Bayer Leverkusen": "https://upload.wikimedia.org/wikipedia/de/f/f7/Bayer_Leverkusen_Logo.svg",
        "FC Schalke 04": "https://upload.wikimedia.org/wikipedia/commons/6/6d/FC_Schalke_04_Logo.svg",
        "Hertha BSC": "https://upload.wikimedia.org/wikipedia/de/3/38/Hertha_BSC_Logo.svg",
        "TSG 1899 Hoffenheim": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Logo_TSG_Hoffenheim.svg"
    },

    defaults: {
        api_key: false,
        colored: false,
        show: "GERMANY",
        focus_on: false,  // false or the name of a team to focus on (used with max_teams)
        max_teams: false,   // false or the number of teams to show either side of the focused team
        leagues: {
            "GERMANY":430,
            "FRANCE": 434,
            "ENGLAND": 426,
            "SPAIN": 436,
            "ITALY": 438
        }
    },

    standings: false,
    help: false,

    voice: {
        mode: "SOCCER",
        sentences: [
            "OPEN HELP",
            "CLOSE HELP",
            "SHOW STANDINGS OF COUNTRY NAME",
            "EXPAND VIEW",
            "COLLAPSE VIEW"
        ]
    },

    // A loading boolean.
    loading: true,

    // Subclass start method.
    start: function() {
        Log.info("Starting module: " + this.name);
        this.currentLeague = this.config.leagues[this.config.show];
        this.getData();
        setInterval(() => {
            this.getData();
        }, this.config.api_key ? 300000 : 1800000); // with api_key every 5min without every 30min
    },

    getData: function(){
        this.sendSocketNotification("GET_DATA", {league: this.currentLeague, api_key: this.config.api_key});
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload){
        if(notification === "DATA"){
            this.standing = payload;
            this.loading = (!this.standing);
            this.updateDom();
        }
    },

    notificationReceived: function (notification, payload, sender) {
        if(notification === "ALL_MODULES_STARTED"){
            var voice = Object.assign({}, this.voice);
            voice.sentences.push(Object.keys(this.config.leagues).join(" "));
            this.sendNotification("REGISTER_VOICE_MODULE", voice);
        } else if(notification === "VOICE_SOCCER" && sender.name === "MMM-voice"){
            this.checkCommands(payload);
        } else if(notification === "VOICE_MODE_CHANGED" && sender.name === "MMM-voice" && payload.old === this.voice.mode){
            this.help = false;
            this.standings = false;
            this.updateDom(300);
        }
    },

    // Subclass getStyles method.
    getStyles: function() {
        return ["font-awesome.css", "MMM-soccer.css"];
    },

    getTranslations: function() {
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        };
    },

    checkCommands: function(data){
        if(/(HELP)/g.test(data)){
            if(/(CLOSE)/g.test(data) || this.help && !/(OPEN)/g.test(data)){
                this.help = false;
            } else if(/(OPEN)/g.test(data) || !this.help && !/(CLOSE)/g.test(data)){
                this.standings = false;
                this.help = true;
            }
        } else if(/(VIEW)/g.test(data)){
            if(/(COLLAPSE)/g.test(data) || this.standings && !/(EXPAND)/g.test(data)){
                this.standings = false;
            } else if(/(EXPAND)/g.test(data) || !this.standings && !/(COLLAPSE)/g.test(data)){
                this.help = false;
                this.standings = true;
            }
        } else if(/(STANDINGS)/g.test(data)){
            var countrys = Object.keys(this.config.leagues);
            for(var i = 0; i < countrys.length; i++){
                var regexp = new RegExp(countrys[i], "g");
                if(regexp.test(data)){
                    this.help = false;
                    if(this.currentLeague !== this.config.leagues[countrys[i]]){
                        this.currentLeague = this.config.leagues[countrys[i]];
                        this.getData();
                    }
                    break;
                }
            }
        }
        this.updateDom(300);
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");
        var standings = document.createElement("div");

        var title = document.createElement("header");
        title.innerHTML = this.standing ? this.standing.leagueCaption : this.name;
        standings.appendChild(title);

        var subtitle = document.createElement("div");
        subtitle.classList.add("xsmall");
        subtitle.innerHTML = this.standing ? this.translate("MATCHDAY") + ": " + this.standing.matchday : this.translate("LOADING");
        standings.appendChild(subtitle);

        // Generate Standings Table
        if(this.standing){
            // Standings container
            var table = document.createElement("table");
            table.classList.add("xsmall", "table");

            // Standings header row
            table.appendChild(this.createLabelRow());

            // Get First and Last teams to display in standings
            var focusTeamIndex, firstTeam, lastTeam;

            /* focus_on for current league is set */
            if(this.config.focus_on && this.config.focus_on.hasOwnProperty(this.config.show)){
                /* focus_on TOP */
                if(this.config.focus_on[this.config.show] === "TOP"){
                    focusTeamIndex = -1;
                    firstTeam = 0;
                    lastTeam = (this.config.max_teams && this.config.max_teams <= this.standing.standing.length) ? this.config.max_teams : this.standing.standing.length;
                }
                /* focus_on BOTTOM */
                else if(this.config.focus_on[this.config.show] === "BOTTOM"){
                    focusTeamIndex = -1;
                    firstTeam = (this.config.max_teams && this.config.max_teams <= this.standing.standing.length) ? this.standing.standing.length - this.config.max_teams : 0;
                    lastTeam = this.standing.standing.length;
                }
                /* focus_on specific team */
                else {
                    for(var i = 0; i < this.standing.standing.length; i++){
                        /* focus_on is teamName */
                        if(this.standing.standing[i].teamName === this.config.focus_on[this.config.show]){
                            focusTeamIndex = i;
                            /* max_teams is set */
                            if(this.config.max_teams){
                                var before = parseInt(this.config.max_teams / 2);
                                firstTeam = focusTeamIndex - before >= 0 ? focusTeamIndex - before : 0;
                                /* index for lastTeam is in range */
                                if(firstTeam + this.config.max_teams <= this.standing.standing.length){
                                    lastTeam =  firstTeam + this.config.max_teams;
                                } else {
                                    lastTeam = this.standing.standing.length;
                                    firstTeam = lastTeam - this.config.max_teams >= 0 ? lastTeam - this.config.max_teams : 0;
                                }
                            } else {
                                firstTeam = 0;
                                lastTeam = this.standing.standing.length;
                            }
                            break;
                        }
                    }
                }
            } else {
                focusTeamIndex = -1;
                firstTeam = 0;
                lastTeam = this.config.max_teams || this.standing.standing.length;
            }

            // Render Team Rows
            for(var i = firstTeam; i < lastTeam; i++){
                table.appendChild(this.createDataRow(this.standing.standing[i], i, focusTeamIndex, false));
            }
            standings.appendChild(table);

            var modules = document.querySelectorAll(".module");
            for (var i = 0; i < modules.length; i++) {
                if(!modules[i].classList.contains("MMM-soccer")){
                    if(this.standings || this.help){
                        modules[i].classList.add("MMM-soccer-blur");
                    } else {
                        modules[i].classList.remove("MMM-soccer-blur");
                    }
                }
            }

            if(this.standings || this.help){
                standings.classList.add("MMM-soccer-blur");
                var modal = document.createElement("div");
                modal.classList.add("modal");
                if(this.standings){
                    var expandedTable = document.createElement("table");
                    expandedTable.classList.add("small", "table");
                    expandedTable.appendChild(this.createLabelRow());

                    for(var i = 0; i < this.standing.standing.length; i++){
                        expandedTable.appendChild(this.createDataRow(this.standing.standing[i], i, focusTeamIndex, true));
                    }
                    modal.appendChild(expandedTable);
                } else {
                    this.appendHelp(modal);
                }
                wrapper.appendChild(modal);
            }
        }

        wrapper.appendChild(standings);

        return wrapper;
    },

    createLabelRow: function () {
        var labelRow = document.createElement("tr");
        labelRow.classList.add("row");

        var position = document.createElement("th");
        labelRow.appendChild(position);

        var logo = document.createElement("th");
        labelRow.appendChild(logo);

        var name = document.createElement("th");
        name.classList.add("name");
        name.innerHTML = this.translate("TEAM");
        labelRow.appendChild(name);

        var pointsLabel = document.createElement("th");
        pointsLabel.classList.add("centered");
        var points = document.createElement("i");
        points.classList.add("fa", "fa-line-chart");
        pointsLabel.appendChild(points);
        labelRow.appendChild(pointsLabel);

        var goalsLabel = document.createElement("th");
        goalsLabel.classList.add("centered");
        var goals = document.createElement("i");
        goals.classList.add("fa", "fa-soccer-ball-o");
        goalsLabel.appendChild(goals);
        labelRow.appendChild(goalsLabel);

        return labelRow;
    },

    createDataRow: function(data, index, focus, expand) {
        var row = document.createElement("tr");
        row.classList.add("centered-row");
        if(index === focus){
            row.classList.add("bright");
        }

        var pos = document.createElement("td");
        pos.innerHTML = data.position;
        row.appendChild(pos);

        var logo = document.createElement("td");
        var icon = document.createElement("img");
        icon.classList.add("icon");
        if (data.crestURI !== "null"){
            icon.src = data.crestURI;   // API returns "null" for teams without a crest
        }
        if(this.icon_fixes.hasOwnProperty(data.teamName)){
            icon.src = this.icon_fixes[data.teamName];
        }
        if(!this.config.colored){
            icon.classList.add("no-color");
        }
        logo.appendChild(icon);
        row.appendChild(logo);

        var name = document.createElement("td");
        name.classList.add("name");
        name.innerHTML = data.teamName;
        row.appendChild(name);

        var points = document.createElement("td");
        points.innerHTML = data.points;
        points.classList.add("centered");
        row.appendChild(points);

        var goals = document.createElement("td");
        goals.innerHTML = data.goalDifference;
        goals.classList.add("centered");
        row.appendChild(goals);

        // Create fade in/out effect.
        if (!expand && this.config.max_teams && focus >= 0) {
            if (index != focus) {
                var currentStep = Math.abs(index - focus);
                row.style.opacity = 1 - (1 / this.config.max_teams * currentStep);
            }
        }

        return row;
    },

    appendHelp: function(appendTo){
        var title = document.createElement("h1");
        title.classList.add("medium");
        title.innerHTML = this.name + " - " + this.translate("COMMAND_LIST");
        appendTo.appendChild(title);

        var mode = document.createElement("div");
        mode.innerHTML = this.translate("MODE") + ": " + this.voice.mode;
        appendTo.appendChild(mode);

        var listLabel = document.createElement("div");
        listLabel.innerHTML = this.translate("VOICE_COMMANDS") + ":";
        appendTo.appendChild(listLabel);

        var list = document.createElement("ul");
        for(var i = 0; i < this.voice.sentences.length; i++){
            var item = document.createElement("li");
            item.innerHTML = this.voice.sentences[i];
            list.appendChild(item);
        }
        appendTo.appendChild(list);
    }
});
