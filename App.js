var Ext = window.Ext4 || window.Ext;
window.console = window.console || (function noop() {}); // keeps IE from blowing up

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    // entry point to app
    launch: function() {
        this.releaseCombobox = this.add({
            xtype: 'rallyreleasecombobox',
            listeners: {
                ready: this._onReleaseComboboxLoad,
                change: this._onReleaseComboboxChanged,
                scope: this
            }
        }); 
    },
    
    _onReleaseComboboxLoad: function() {
        var query = this.releaseCombobox.getQueryFromSelected();
        this._loadFeatures(query);
    },
    _onReleaseComboboxChanged: function() {
        var store = this._myGrid.getStore();
        store.clearFilter(true);
        store.filter(this.releaseCombobox.getQueryFromSelected());
    },
    
    // load features into store
    _loadFeatures: function(query) {
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Feature',
            autoLoad: true,
            filters: query,
            remoteSort: false,
            listeners: {
                load: function(store, records, success) {
                    // console.log("Loaded Store with %i records", records.length);
                    this._calculateScore(records); // make sure the scores are up to date
                    this._updateGrid(store); // populate the grid
                },
                update: function(store, rec, modified, opts) {
                    this._calculateScore([rec]); // only update the record (feature) that changed
                },
                scope: this
            },

            fetch: ['Name', 'FormattedID', 'Release', 'TimeValue', 'OERR', 'UserValue', 'Score', 'JobSize']
        });
    },

    _calculateScore: function(records) {
        Ext.Array.each(records, function(feature) {
            // get the data used to calc score
            var jobSize = feature.data.JobSize;
            var timeValue = feature.data.TimeValue;
            var OERR = feature.data.OERR;
            var userValue = feature.data.UserValue;
            var oldScore = feature.data.Score; // if feature is undefined, set it to 0

            if (jobSize > 0) { // jobSize is the denominator so make sure it's not 0
                var score = Math.floor(((userValue + timeValue + OERR ) / jobSize) + 0.5);
                if (oldScore !== score) { // only update if score changed
                    feature.set('Score', score); // set score value in db
                    //feature.save();
                    // don't call feature.save(); it just breaks stuff
                    // console.log("Setting a new score", score);
                }
            }
        });
    },

    _createGrid: function(myStore) {
        var mySort = function(state) {
            var ds = this.up('grid').getStore();
            var field = this.getSortParam();
            ds.sort({ // SDK grid has a bug with null values, which mucks up the native sort so create our own
                property: field,
                direction: state,
                sorterFn: function(v1, v2)
                {
                    v1 = v1.get(field);
                    v2 = v2.get(field);
                    if (v1 > v2) {return 1;}
                    if (v1 == v2) {return 0;}
                    if (v1 < v2) {return -1;}
                }
            });
        };

        // console.log("Load up a populated grid!", myStore);
        this._myGrid = Ext.create('Rally.ui.grid.Grid', {
            xtype: 'rallygrid',
            title: 'Feature Scoring Grid',
            height: '98%',
            store: myStore,
            enableEditing: true,
            selType: 'cellmodel',
            columnCfgs: [{ // override ID and Name configs to prevent default edit enabling
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
            
            'TimeValue','OERR', 'UserValue', 'JobSize',

            { // override score so that the user can't edit it
                text: "Score",
                dataIndex: 'Score',
                doSort: mySort
            }]
        });
        this.add(this._myGrid);

        // override the event publish to prevent random refreshes of the whole app when the cell changes
       var celledit = this._myGrid.plugins[0];
        var oldPub = celledit.publish;
        var newPub = function(event, varargs) {
            if (event !== "objectupdate") {
                oldPub.apply(this, arguments);
            }
            else {
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
