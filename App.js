var Ext = window.Ext4 || window.Ext;
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    //items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc2 Docs</a>'},
    launch: function() {
        this.releaseCombobox = this.add({
            xtype: "rallyreleasecombobox",
            allowNoEntry: true,
            editable: true,
            //stateful: true,
            //stateId: this.getContext().getScopedStateID('release'),
            context: this.getContext(),
            defaultToCurrentTimebox: false,
            listeners: {
                ready: this._addReleaseCombobox,
                change: this._onReleaseComboboxChanged,
                scope: this
            }
        });
    }, //end launch
    
    _addReleaseCombobox: function() {
        console.log("Adding Release Combobox");
        var rcb = this.releaseCombobox.getStore();
        if (rcb) {
            rcb.add({Name: "No Filter"});
        }
        console.log("added rel combo box");
        this._addPICombobox();
    },
    
    _onReleaseComboboxChanged: function() {
        this._onPICombobox();
       /* var releaseFilter = this.releaseCombobox.getQueryFromSelected();
        var selectedRelease = this.releaseCombobox.getRecord();
        if( selectedRelease ) {
            if( selectedRelease.data.Name == "No Filter" ) {
                releaseFilter = [];
            }
        }
 
        // if we don't yet have a PI combo box or if this is anything other than
        // the lowest level PI, bail
        if ( this.piCombobox ) {
            console.log("resetting filter");
            if (this.piCombobox.getRecord().get('Ordinal') === 0)
            {
                if(this._myGrid ) {
                    var store = this._myGrid.getStore();
                    store.clearFilter(!0);
                    store.filter(releaseFilter);
                }
            }
        }*/
    },
    
    _addPICombobox: function() {
        this.piCombobox = this.add({
            xtype: "rallyportfolioitemtypecombobox",
            //defaultSelectionPosition : 'last',
            listeners: {
                ready: this._onPICombobox,
                change: this._onPICombobox,
                scope: this
            }
        });
    },

    _onPICombobox: function() {
        var selectedType = this.piCombobox.getRecord();
        var query = [];
        if (this.piCombobox.getRecord().get('Ordinal') === 0) {
            // Only use the release filter if the PI is the lowest level
            // and then ensure it is enabled
            this.releaseCombobox.enable();
            console.log("ModelFactory: getting release filter");
            var selectedRelease = this.releaseCombobox.getRecord();
            if( selectedRelease ) {
                if( selectedRelease.data.Name != "No Filter" ) {
                    console.log("selected release: ", selectedRelease.data.Name);
                    query = this.releaseCombobox.getQueryFromSelected();
                } 
            } else { // catch "Unscheduled"
                query = this.releaseCombobox.getQueryFromSelected();
            }
        } else { // disable the ReleaseComboBox if Feature not selected
           this.releaseCombobox.disable();
        }
    
        Rally.data.ModelFactory.getModel({
            type: selectedType.get('TypePath'),
            success: function(model){
                if (this._myGrid === undefined) {
                    Ext.create("Rally.data.WsapiDataStore", {
                        model: model,
                        autoLoad: true,
                        filters: query,
                        remoteSort: false,
                        listeners: {
                            load: function(store, records, success) {
                                this._calculateScore(records);
                                this._updateGrid(store);
                            },
                            update: function(store, rec, modified, opts) {
                                this._calculateScore([rec]);
                            },
                            scope: this
                        },
                        fetch: ["Name", "FormattedID", "Release", 
                            "TimeCriticality", "RROEValue", "UserBusinessValue",
                            "WSJFScore", "JobSize"]
                    });
                }
                else { // grid exists, reset the model to the correct PI type
                    this._myGrid.reconfigureWithModel(model);
                    
                    // clear and re-apply filter since reconfiguring model 
                    // doesn't do this
                    var store = this._myGrid.getStore();
                    store.clearFilter(!0), store.filter(query);
                   
                    // re-apply grid update listeners
                    var that = this;
                    store.addListener('update', function(store, rec, modified, opts) {
                        that._calculateScore([rec]);
                    });
                    store.addListener('load', function(store, records, modified, opts) {
                        that._calculateScore(records); that._updateGrid(store);
                    });
                }
            },
            scope: this
        });
    },
    
    _calculateScore: function(records) {
        Ext.Array.each(records, function(feature) {
            //console.log("feature", feature.data);
            var jobSize = feature.data.JobSize;
            var timeValue = feature.data.TimeCriticality;
            var OERR = feature.data.RROEValue;
            var userValue = feature.data.UserBusinessValue;
            var oldScore = feature.data.WSJFScore;
            //console.log("jobsize: ", jobSize);
            if (jobSize > 0) { // jobSize is the denominator so make sure it's not 0
                var score;
                var defaultToIntegerScore = true;
    
                if( defaultToIntegerScore ) {
                    score = Math.floor(((userValue + timeValue + OERR ) / jobSize) + 0.5);
                }
                else {
                    score = Math.floor(((userValue + timeValue + OERR ) / jobSize) * 100)/100;
                }
                //console.log("oldScore, newScore: ", feature.data.Name, oldScore, score);
                if (oldScore !== score) { // only update if score changed
                    feature.set('WSJFScore', score); // set score value in db
                    //console.log("setting score");
                    //feature.save();
                }
            }
        });
    },
    
    _createGrid: function(myStore) {
        //console.log("Creating Grid");
        this._myGrid = Ext.create("Rally.ui.grid.Grid", {
            xtype: "rallygridboard",
            title: "Feature Scoring Grid",
            height: "98%",
            store: myStore,
            enableBulkEdit: true,
            enableRanking: true,
            defaultSortToRank: true,
            selType: "cellmodel",
            columnCfgs: [
                {
                    text: "Portfolio ID",
                    dataIndex: "FormattedID",
                    flex: 1,
                    xtype: "templatecolumn",
                    tpl: Ext.create("Rally.ui.renderer.template.FormattedIDTemplate")
                }, 
                {
                    text: "Name",
                    dataIndex: "Name",
                    flex: 2
                }, 
                "TimeCriticality", "RROEValue", "UserBusinessValue", "JobSize", 
                {
                    text: "WSJF Score",
                    dataIndex: "WSJFScore",
                    editor: null
                }
            ],
            scope: this
        }), this.add(this._myGrid);
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
