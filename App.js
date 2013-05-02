var Ext = window.Ext4 || window.Ext;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    // entry point to app
    launch: function() {
        console.log("TimeStamp: 2:26");
        this._doLayout();
    },

    //initial layout of widgets
    _doLayout: function() {
        this._loadFeatures();
        console.log("loaded features");
    },

    // load features
    _loadFeatures: function() {
        console.log("Loading features");

        var myStore = Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Feature',
            autoLoad: true,
            listeners: {
                load: function(store, records, success) {
                    console.log("Loaded Store with %i records", records.length);
                    this._calculateScore(records);
                    this._updateGrid(store);
                },
                datachanged: function() {
                    console.log("Data changed");
                },

                update: function(store, rec, modified, opts) {
                    console.log("data updated")
                    //this._calculateScore(store.getRecords());
                    this._calculateScore([rec]);
                },
                scope: this
            },

            fetch: ['Name', 'FormattedID', 'WSJFJobSize', 'WSJFTimeValue', 'WSJFOERR', 'WSJFUserValue', 'WSJFScore'],
        });
    },

    _calculateScore: function(records) {
        console.log("entered _calculateStore");
        var count = records.length;
        var me = this;
        
        Ext.Array.each(records, function(feature) {
            // get the score data
            console.log("Feature data", feature.data, feature.data.WSJFJobSize);
            var jobSize = parseInt(feature.data.WSJFJobSize + "", 10);
            var timeValue = parseInt(feature.data.WSJFTimeValue + "", 10);
            var OERR = parseInt(feature.data.WSJFOERR + "", 10);
            var userValue = parseInt(feature.data.WSJFUserValue + "", 10);

            console.log(jobSize, timeValue, OERR, userValue);

            if (jobSize > 0) {
                var score = ~~ (((userValue + timeValue + OERR) / jobSize) + 0.5);
                console.log("score = " + score);
                
                if (parseInt(feature.get("WSJFScore") + "", 10) !== score) {
                    feature.set('WSJFScore', score); // set score value in db TO DO
                    console.log("Setting a new score");
                    feature.save({
                        callback: {
                            success: function () {
                                count = count - 1;
                                
                                if (count <= 0) {
                                    me._myGrid.reconfigure(me._myGrid.store);
                                }
                            }
                        }
                    });
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
//             plugins: [
//             Ext.create(/*'Ext.grid.plugin.CellEditing'*/'Rally.ui.grid.plugin.CellEditing', {
//                 clicksToEdit: 1,
//                 /*
//                     listeners: {
//                         validateedit: function (editor, e, field, fValue) {
//                             console.log("Cell validate edit!", arguments);
//                             this._calculateScore([e.record]);
//                         },
//                         scope: this
//                     },
// */
//                 scope: this
//             })],
            // columnCfgs: [{
            //     text: 'Portfolio ID',
            //     dataIndex: 'FormattedID',
            //     flex: 1,
            //     xtype: 'templatecolumn',
            //     tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
            // }, {
            //     text: 'Name',
            //     dataIndex: 'Name',
            //     flex: 2
            // }, {
            //     text: 'WSJF Time Value',
            //     dataIndex: 'WSJFTimeValue',
            //     flex: 1
            //     // editor: {
            //     //     xtype: 'numberfield',
            //     //     allowBlank: false,
            //     //     minValue: 0
            //     // }
            // },

            // {
            //     text: 'WSJF JobSize',
            //     dataIndex: 'WSJFJobSize',
            //     flex: 1
            //     // editor: {
            //     //     xtype: 'numberfield',
            //     //     allowBlank: false,
            //     //     minValue: 0
            //     // }
            // }, {
            //     text: 'WSJF OERR',
            //     dataIndex: 'WSJFOERR',
            //     flex: 1
            //     // editor: {
            //     //     xtype: 'numberfield',
            //     //     allowBlank: false,
            //     //     minValue: 0
            //     // }
            // }, {
            //     text: 'WSJF User Value',
            //     dataIndex: 'WSJFUserValue',
            //     flex: 1
            //     // editor: {
            //     //     xtype: 'numberfield',
            //     //     allowBlank: false,
            //     //     minValue: 0
            //     // }
            // }, {
            //     text: 'Score',
            //     dataIndex: 'WSJFScore',
            //     flex: 1
            // }]
            columnCfgs: [
                {
                    text: 'Portfolio ID',
                    dataIndex: 'FormattedID',
                    flex: 1,
                    xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },             
                
                { 
                    text: "Name",
                    dataIndex: "Name",
                    flex: 2
                }, 
                
                "WSJFTimeValue", 'WSJFJobSize', 'WSJFOERR', 'WSJFUserValue', 
                
                {
                    text: "Score",
                    dataIndex: 'WSJFScore'
                }
            ]
        });
        this.add(this._myGrid);

        console.log("Plugins");
        console.dir(this._myGrid.plugins[0]);
        
        window.parent.MYGRID = this._myGrid.plugins;
        
        var oldPub = this._myGrid.plugins[0].publish;
        var newPub = function (event, varargs) {
            console.log("New Publish", event, varargs);
            
            if (event !== "objectupdate") {
                oldPub.apply(this, arguments);
            } else {
                console.log("No soup for you!");
            }
        }
        
        this._myGrid.plugins[0].publish = Ext.bind(newPub, this._myGrid.plugins[0]);
        
        /*
        Ext.override(this._myGrid.plugins[0], {
            _saveInlineEdit: function(editor, event) {
                console.log("Hello from override");
                
                if (Ext.Object.getSize(event.record.getChanges()) > 0) {
                    var grid = this.grid,
                        record = this.context.record,
                        column = this.context.column;
    
                    console.log(this.context, event.record);
                    
                    grid.fireEvent('inlineEdit', this, editor, event);
    
                    event.record.save({
                        callback: function(records, operation) {
                            var success = operation.success;
                            if (success) {
                                this.publish(Rally.Message.objectUpdate, records, this);
                                this.publish(Rally.Message.recordUpdateSuccess, records);
                            } else {
                                this.publish(Rally.Message.recordUpdateFailure);
                            }
    
                            if(this.grid){
                                this.grid.fireEvent('inlineeditsaved', this, records, operation, record, column);
                                this._onPossibleGridHeightChange();
                                if(success){
                                    Ext.each(records, function(record) {
                                        this.grid.highlightRowForRecord(record);
                                    }, this);
                                }
                            }
                        },
                        scope: this,
                        params: {
                            fetch: grid.getAllFetchFields()
                        }
                    });
                }else{
                    this._onPossibleGridHeightChange();
                }
            }
        });
        */
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
