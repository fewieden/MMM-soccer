/* Magic Mirror
 * Module: MMM-soccer
 *
 * By fewieden https://github.com/fewieden/MMM-soccer
 *
 * MIT Licensed.
 */

Module.register("MMM-soccer",{

    defaults: {
        api_key: false,
        show: 'GERMANY',
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

    // A loading boolean.
    loading: true,

    // Subclass start method.
    start: function() {
        Log.info("Starting module: " + this.name);
        this.currentLeague = this.config.leagues[this.config.show];
        this.getData();

        this.getData();
        var self = this; 
        setInterval(function() {
            self.getData();
        }, this.config.api_key ? 300000 : 1800000); // with api_key every 5min without every 30min
    },

    getData: function(){
        this.sendSocketNotification('GET_DATA', {league: this.currentLeague, api_key: this.config.api_key});
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload){
        if(notification === 'DATA'){
            this.standing = payload;
            this.loading = (!this.standing);
            this.updateDom();
        }
    },

    // Subclass getStyles method.
    getStyles: function() {
        return ["MMM-soccer.css"];
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        if (this.loading ||
            !this.standing) {
            var title = document.createElement("header");
            title.innerHTML = this.name;
            wrapper.appendChild(title);

            var subtitle = document.createElement("div");
            subtitle.className = "small dimmed light";
            subtitle.innerHTML = (this.loading) ? this.translate("LOADING") : "No data available" ;
            wrapper.appendChild(subtitle);

            return wrapper;
        }

        // Generate Standings Table
        if(this.standing){
            // League header
            var title = document.createElement("header");
            title.innerHTML = this.standing.leagueCaption;
            wrapper.appendChild(title);

            // Matchday indicator
            var subtitle = document.createElement("p");
            subtitle.classList.add("xsmall");
            subtitle.innerHTML = "Matchday: " + this.standing.matchday;
            wrapper.appendChild(subtitle);

            // Standings container
            var rows = document.createElement('div');
            rows.classList.add("xsmall");

            // Standings header row
            var row = document.createElement('div');
            row.classList.add('row', 'keys');

            var name = document.createElement('div');
            name.classList.add('name');
            name.innerHTML = 'Team';
            row.appendChild(name);

            var details = document.createElement('div');
            details.classList.add('details');

            var points = document.createElement('img');
            points.classList.add('key-icon');
            points.src = this.file('icons/points.png');
            details.appendChild(points);

            var goals = document.createElement('img');
            goals.classList.add('key-icon');
            goals.src = this.file('icons/goal.png');
            details.appendChild(goals);
            row.appendChild(details);

            rows.appendChild(row);

            // Get First and Last teams to display in standings
            var focusTeamIndex;
            var firstTeam = 0;
            var lastTeam = this.standing.standing.length;
            if (this.config.max_teams >= 0 && this.config.focus_on) {
                for(var i = 0; i < this.standing.standing.length; i++){
                    if(this.standing.standing[i].teamName === this.config.focus_on){
                        focusTeamIndex = i;
                        firstTeam = (focusTeamIndex - this.config.max_teams < 0) ? firstTeam : focusTeamIndex - this.config.max_teams;
                        lastTeam = (focusTeamIndex + this.config.max_teams + 1 > lastTeam) ? lastTeam : focusTeamIndex + this.config.max_teams + 1;
                        break;
                    }

                }
            }

            // Render Team Rows
            for(var i = firstTeam; i < lastTeam; i++){
                var row = document.createElement('div');
                row.classList.add('row');

                var pos = document.createElement('div');
                pos.classList.add('position');
                pos.innerHTML = this.standing.standing[i].position;
                row.appendChild(pos);

                var icon = document.createElement('img');
                icon.classList.add('icon');
                if (this.standing.standing[i].crestURI != "null") 
                    icon.src = this.standing.standing[i].crestURI;   // API returns "null" for teams without a crest
                row.appendChild(icon);

                var name = document.createElement('div');
                name.classList.add('name');
                name.innerHTML = this.standing.standing[i].teamName;
                row.appendChild(name);

                var details = document.createElement('div');
                details.classList.add('details');

                var points = document.createElement('span');
                points.innerHTML = this.standing.standing[i].points;
                details.appendChild(points);

                var goals = document.createElement('span');
                goals.innerHTML = this.standing.standing[i].goalDifference;
                details.appendChild(goals);
                row.appendChild(details);

                // Create fade in/out effect.
                if (this.config.max_teams && focusTeamIndex >= 0) {
                    if (i != focusTeamIndex) {
                        var currentStep = Math.abs(i - focusTeamIndex);
                        row.style.opacity = 1 - (1 / this.config.max_teams * currentStep);
                    }
                }

                rows.appendChild(row);
            }
            wrapper.appendChild(rows);
        }
        return wrapper;
    }
});
