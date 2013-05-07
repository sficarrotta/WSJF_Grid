var Ext = window.Ext4 || window.Ext;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    // entry point to app
    launch: function() {
        this._doLayout();
    },

    //initial layout of widgets
    _doLayout: function() {
        this._loadFeatures();
    },

    // load features into store
    _loadFeatures: function() {
        window.console && console.log("Loading features");

        Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Feature',
            autoLoad: true,
            listeners: {
                load: function(store, records, success) {
                    console.log("Loaded Store with %i records", records.length);
                    this._calculateScore(records); // make sure the scores are up to date
                    this._updateGrid(store); // populate the grid
                },

                update: function(store, rec, modified, opts) {
                    console.log("data updated");
                    this._calculateScore([rec]); // only update the record (feature) that changed
                },
                scope: this
            },

            fetch: ['Name', 'FormattedID', 'JobSize', 'TimeValue', 'OERR', 'UserValue', 'Score']
        });
    },

    _calculateScore: function(records) {        
        Ext.Array.each(records, function(feature) {
            // get the data used to calc score
            // if poor performance is an issue, you can try taking off the parseInt casts
            var jobSize = parseInt(feature.data.JobSize + "", 10); // parse int ensures we are dealing with ints, base 10
            var timeValue = parseInt(feature.data.TimeValue + "", 10);
            var OERR = parseInt(feature.data.OERR + "", 10);
            var userValue = parseInt(feature.data.UserValue + "", 10);

            if (jobSize > 0) { // jobSize is the denominator so make sure it's not 0
                var score = ~~ (((userValue + timeValue + OERR) / jobSize) + 0.5); // shortcut for casting to int
                
                if (parseInt(feature.get("Score") + "", 10) !== score) { // only update if score changed
                    feature.set('Score', score); // set score value in db
                    // don't call feature.save(); it just breaks stuff
                    console.log("Setting a new score");
                }
            }
        });
    },
    
    _createGrid: function(myStore) {
        console.log("Load up a populated grid!", myStore);
        this._myGrid = Ext.create('Rally.ui.grid.Grid', {
            xtype: 'rallygrid',
            title: 'Feature Scoring Grid',
            height: 200,
            store: myStore,
            enableEditing: true,
            selType: 'cellmodel',
            columnCfgs: [
                { // override ID and Name - no changes on these allowed in this grid
                    text: 'Portfolio ID',
                    dataIndex: 'FormattedID',
                    flex: 1,
                    xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate') // make the ID a live link
                },             
                
                { 
                    text: "Name",
                    dataIndex: "Name",
                    flex: 2
                }, 
                
                "TimeValue", 'OERR', 'UserValue', 'JobSize', // use native Ext formatting - allows cell edits & got rid of errors
                
                { // override score so that the user can't edit it
                    text: "Score",
                    dataIndex: 'Score'
                }
            ]
        });
        this.add(this._myGrid);
        
        // override the event publish to prevent random refreshes of the whole app when the cell changes
        var celledit = this._myGrid.plugins[0];
        var oldPub = celledit.publish;
        var newPub = function (event, varargs) {  
            if (event !== "objectupdate") {
                oldPub.apply(this, arguments);
            } else {
                // no-op
            }
        };
        
        celledit.publish = Ext.bind(newPub, celledit);
    },
    _updateGrid: function(myStore) {
        if (this._myGrid === undefined) {
            this._createGrid(myStore);
        }
        else {
            this._myGrid.reconfigure(myStore);
        }
    }
});
