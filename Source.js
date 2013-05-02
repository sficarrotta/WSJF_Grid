<!DOCTYPE html>
<html>
<head>
    <title>RunningTotal</title>

    <script type="text/javascript" src="/apps/2.0p5/sdk.js"></script>

    <script type="text/javascript">
        Rally.onReady(function() {
            /*
             * Overriding the _setOpacity because the IE workaround is breaking
             */
            Ext.override(Rally.ui.grid.dragdrop.DragDropRowProxy,{
                
                _setOpacity: function(trEl, opacity) {
                    trEl.setOpacity(opacity);
                    if (Ext.isIE) {
                        /*trEl.query('td').each(function(tdDom) {
                            Ext.fly(tdDom).setOpacity(opacity);
                        });*/
                    }
                }
            });
            /*
             * Same as ranker, but won't show the flair when done!
             */
            Ext.define('PXSRanker', {
                extend: 'Rally.data.Ranker',
            	init: function() {
            		this.callParent(arguments);
            	},
            	 /**
                 * @param {Object} config Config object with the following parameters:
                 *  recordToRank {Ext.data.Model} - the record being reranked
                 *  relativeRecord {Ext.data.Model} - the record that recordToRank is being ranked before or after
                 *  position {String} - the relative position ('before' or 'after')
                 *  saveOptions {Object} - config object for {Ext.data.Operation}
                 */
                rankRelative: function(config) {
                    var saveOptions = Ext.merge({}, config.saveOptions),
                        rankParamName = this.relativeRankPrefix + (config.position === 'after' ? 'Below' : 'Above');
            
                    saveOptions.params = saveOptions.params || {};
                    saveOptions.params[rankParamName] = config.relativeRecord.get('_ref');
                    saveOptions.originalCallback = saveOptions.callback;
                    saveOptions.callback = Ext.bind(this._rankRelativeCallback, this, [saveOptions], true);
            
                    /* Rally.ui.flair.FlairManager.showStatusFlair({message: 'Moving...'}); */
                    config.recordToRank.save(saveOptions);
                },
            
                _rankRelativeCallback: function(record, operation, saveOptions) {
                    var formattedId = record.get('FormattedID'),
                        name = record.get('Name'),
                        recordText = '"' + (Ext.isEmpty(formattedId) ? '' : formattedId + ': ') + name + '"';
            
                    if (operation.success) {
                        /*Rally.ui.flair.FlairManager.showFlair({message: Ext.String.format('{0} has been moved.', recordText)}); */
                    } else {
                        /*Rally.ui.flair.FlairManager.showErrorFlair({message: Ext.String.format('Error moving {0}.', recordText)}); */
                    }
            
                    if (saveOptions.originalCallback) {
                        saveOptions.originalCallback.call(saveOptions.scope || this, record, operation);
                    }
                }
            });            Ext.define('PXSCellEdit',{
            	extend: 'Rally.ui.grid.plugin.CellEditing',
            	alias: 'plugin.pxscellediting',
            	init: function() {
            		this.callParent(arguments);
            	},
            	/* 
            	 * at some point, the base plugin started putting the rally-edit-cell-over 
            	 * class on the cell whether it was editable or not
            	 * 
            	 */
                _onUiEvent: function(type, view, cell, rowIndex, cellIndex, e) {
                	if ( this.grid.columns[cellIndex] && this.grid.columns[cellIndex].editor ) {
            	        var cellEl = Ext.fly(cell);
            	        if (cellEl) {
            	            if (type === 'mouseover') {
            	                cellEl.addCls('rally-edit-cell-over');
            	            } else if (type === 'mouseout') {
            	                cellEl.removeCls('rally-edit-cell-over');
            	            }
            	        }
                	}
                },
                _saveInlineEdit: function(editor, event) {
                    if (Ext.Object.getSize(event.record.getChanges()) > 0) {
                        var grid = this.grid,
                            record = this.context.record,
                            column = this.context.column;
            
                        grid.fireEvent('inlineEdit', this, editor, event);
            
                        event.record.save({
                            callback: function(records, operation) {
                                var success = operation.success;
                                if (success) {
                                    //this.publish(Rally.Message.objectUpdate, records, this);
                                    //this.publish(Rally.Message.recordUpdateSuccess, records);
                                } else {
                                    //this.publish(Rally.Message.recordUpdateFailure);
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
            });            /**
             * A Header subclass which renders a checkbox in each column cell which toggles the truthiness of the associated data field on click.
             *
             * Because Rally isn't providing the ux options, I stole this from here (and modified it):
             * 
             * http://docs.sencha.com/ext-js/4-1/#!/api/Ext.ux.CheckColumn
             * 
             * Example usage:
             * 
             *    // create the grid
             *    var grid = Ext.create('Ext.grid.Panel', {
             *        ...
             *        columns: [{
             *           text: 'Foo',
             *           ...
             *        },{
             *           xtype: 'checkcolumn',
             *           text: 'Indoor?',
             *           dataIndex: 'indoor',
             *           width: 55
             *        }]
             *        ...
             *    });
             *
             * In addition to toggling a Boolean value within the record data, this
             * class adds or removes a css class <tt>'rally-grid-checked'</tt> on the td
             * based on whether or not it is checked to alter the background image used
             * for a column.
             */
            Ext.define('PXSCheckColumn', {
                extend: 'Ext.grid.column.Column',
                alias: 'widget.pxscheckcolumn',
            
                /**
                 * @cfg {Boolean} [stopSelection=true]
                 * Prevent grid selection upon mousedown.
                 */
                stopSelection: true,
            
                tdCls: Ext.baseCSSPrefix + 'grid-cell-checkcolumn',
            
                constructor: function() {
                    this.addEvents(
                        /**
                         * @event beforecheckchange
                         * Fires when before checked state of a row changes.
                         * The change may be vetoed by returning `false` from a listener.
                         * @param {Ext.ux.CheckColumn} this CheckColumn
                         * @param {Number} rowIndex The row index
                         * @param {Boolean} checked True if the box is to be checked
                         */
                        'beforecheckchange',
                        /**
                         * @event checkchange
                         * Fires when the checked state of a row changes
                         * @param {Ext.ux.CheckColumn} this CheckColumn
                         * @param {Number} rowIndex The row index
                         * @param {Boolean} checked True if the box is now checked
                         */
                        'checkchange'
                    );
                    this.callParent(arguments);
                },
            
                /**
                 * @private
                 * Process and refire events routed from the GridView's processEvent method.
                 */
                processEvent: function(type, view, cell, recordIndex, cellIndex, e, record, row) {
                    var me = this,
                        key = type === 'keydown' && e.getKey(),
                        mousedown = type == 'mousedown';
            
                    if (mousedown || (key == e.ENTER || key == e.SPACE)) {
                        var dataIndex = me.dataIndex,
                            checked = !record.get(dataIndex);
            
                        // Allow apps to hook beforecheckchange
                        if (me.fireEvent('beforecheckchange', me, recordIndex, checked) !== false) {
                            record.set(dataIndex, checked);
                            me.fireEvent('checkchange', me, recordIndex, checked);
            
                            // Mousedown on the now nonexistent cell causes the view to blur, so stop it continuing.
                            if (mousedown) {
                                e.stopEvent();
                            }
            
                            // Selection will not proceed after this because of the DOM update caused by the record modification
                            // Invoke the SelectionModel unless configured not to do so
                            if (!me.stopSelection) {
                                view.selModel.selectByPosition({
                                    row: recordIndex,
                                    column: cellIndex
                                });
                            }
            
                            // Prevent the view from propagating the event to the selection model - we have done that job.
                            return false;
                        } else {
                            // Prevent the view from propagating the event to the selection model if configured to do so.
                            return !me.stopSelection;
                        }
                    } else {
                        return me.callParent(arguments);
                    }
                },
            
                // Note: class names are not placed on the prototype bc renderer scope
                // is not in the header.
                renderer : function(value){
                    //window.console && console.log("renderer", value);
                    
                    var cssPrefix = Ext.baseCSSPrefix,
                        cls = ['pxs-grid-checker'];
                        //cls = [cssPrefix + 'grid-checkheader'];            
                        
                    if (value) {
                        //cls.push(cssPrefix + 'grid-checkheader-checked');
                        cls.unshift('pxs-grid-checked');
                        
                    }
                    return '<div class="' + cls.join(' ') + '">&#160;</div>';
                }
            });            /*
             * A dialog that allows the user to pick a field and a value
             * 
             * @example
             * Ext.create('Rally.pxs.dialog.FieldEditDialog, {
             *      fieldCfgs: [ { label: 'FieldName', editor: 'rallytextfield' } ],
             *      saveLabel: 'Save',
             *      saveFn: function() {
             *          // do something awesome
             *      }
             * }).show();
             */
             Ext.define( 'Rally.pxs.dialog.FieldEditDialog', {
                extend: 'Rally.ui.dialog.Dialog',
                alias: 'widget.pxsfieldeditdialog',
                width: 350,
                closable: true,
                config: {
                    /**
                     * @cfg {String}
                     * Title to give to the dialog
                     */
                     title: 'Apply Change To All Selected Records',
                     
                     /**
                      * @cfg {String}
                      * The label for the save button
                      */
                      saveLabel: 'Save',
                      
                      /**
                       * @cfg {Function}
                       * Function called when the save button is pushed
                       * @param {Rally.pxs.dialog.FieldEditDialog} this
                       * @param {String} newValue
                       */
                       saveFn: Ext.emptyFn,
                       
                       /**
                        * @cfg {Function}
                        * Function called when the cancel button is pushed
                        */
                        cancelFn: Ext.emptyFn,
                        
                        /**
                         * @cfg {Object}
                         * Scope to call the functions with
                         */
                         scope: undefined,
                         
                         /**
                          * @cfg {Object}
                          * An array of objects with two fields: label: label to show, editor: same as column editor
                          */
                          fieldCfgs: []
                },
                items: {
                    xtype: 'panel',
                    border: false,
                    items: [
                        { xtype: 'container', layout: 'hbox', defaults: {padding: 10}, items: [
            	            { xtype: 'container', itemId: 'field_selector' },
            	            { xtype: 'container', itemId: 'field_editor' }
                        ] }
                    ]
                },
                constructor: function(config) {
                    this.mergeConfig(config);
                    this.callParent(arguments);
                },
                initComponent: function() {
                    this.callParent(arguments);
            
                    this._addButtons();
                    this._createFieldSelector();
                },
                _createFieldSelector: function() {
                    if ( this.config.fieldCfgs.length === 0 ) {
                        throw "no fieldCfgs provided to 'pxsfieldeditdialog";
                    }
                    var store = Ext.create('Ext.data.Store', {
                        fields: [ 'label', 'editor' ],
                        data: this.config.fieldCfgs
                    });
                    this.field_selector = Ext.create('Ext.form.field.ComboBox', {
                        store: store,
                        queryMode: 'local',
                        displayField: 'label',
                        valueField: 'editor',
                        listeners: {
                            scope: this,
                            change: function(field,newValue) {
                                if ( this.down('#field_box') ) { 
                                    this.down('#field_box').destroy(); 
                                }
                                if ( typeof(newValue) === "string" ) {
                                   this.down('#field_editor').add({ 
            	                        xtype: newValue,
                                        itemId: "field_box"
            	                    }); 
                                } else {
                                    newValue["itemId"] = "field_box";
                                    this.down('#field_editor').add(newValue);
                                }
                                
                            }
                        }
                    });
                    
                    this.down('#field_selector').add(this.field_selector);
                },
                _addButtons: function() {
                    var that = this;
                    this.down('panel').addDocked({
                        xtype: 'toolbar',
                        dock: 'bottom',
                        padding: '0 0 10 0',
                        layout: {
                            pack: 'center'
                        },
                        ui: 'footer',
                        items: [
                        {
                            xtype: 'rallybutton',
                            text: this.config.saveLabel,
                            handler: function() {
                                this.config.saveFn.call(this.config.scope, this, this.field_selector.getRawValue(),  this.down('#field_box').getValue());
                                this.close();
                            },
                            scope: this
                        },
                        {
                            xtype: 'rallybutton',
                            text: 'Cancel',
                            handler: function() {
                                this.config.cancelFn.call(this.config.scope);
                                this.close();
                            },
                            scope: this,
                            ui: 'link'
                        }
                        ]
                    });
                }
             });            /*
             * An attempt to control the flair stuff
             */
            Ext.define('PXSDrag',{
            	extend: 'Rally.ui.grid.plugin.DragDrop',
            	requires: ['PXSRanker'],
            	alias: 'plugin.pxsdragdrop',
            	init: function() {
            		this.callParent(arguments);
            		this.enable();  // assuming we're starting ranked.  Data load isn't kicking this off!
            	},
            	/* not sure why the thumbs are failing without this */
                _showRankColumn: function() {
                    if ( this.view && this.view !== null ) {
            	        if (!this.view.hasCls(this.rankEnabledCls)) {
            	            this.view.addCls(this.rankEnabledCls);
            	        }
                    }
                },
                _setupViewScroll: function() {
                    var el = this.view.getEl();
            
                    el.ddScrollConfig = {
                        vthresh: 20,
                        hthresh: -1,
                        frequency: 50,
                        increment: 500
                    };
                    Ext.dd.ScrollManager.register(el);
                },
            	_getRanker: function() {
                    if (!this.ranker) {
                        var store = this.view.getStore(),
                            config = {store: store};
            
                        if (store.model.elementName === 'Task') {
                            config.rankField = 'TaskIndex';
                            config.relativeRankPrefix = 'taskIndex';
                        }
                        this.ranker = Ext.create('PXSRanker', config);
                    }
            
                    return this.ranker;
                }
            });            /*global console, Ext */
            var renderUSDate = function(value) {
                var display_value = "";
                if ( value ) {
                    display_value = Rally.util.DateTime.format( value, 'm/d/Y');
                }
                return display_value;
            };
            var renderFieldName = function(value) {
                var display_value = "";
                if ( value ) {
                    display_value = value._refObjectName;
                }
                return display_value;
            };
            var renderRank = function(value, metaData, record, rowIndex, colIndex, store, view) {
                return rowIndex + 1;  
            };
                
            var renderId = function(value, metaData, record, rowIndex, colIndex, store, view) {
                var item = record.getData();
                var url = Rally.util.Navigation.createRallyDetailUrl(item);
                var formatted_string = "<a target='_top' href='" + url + "'>" + item.FormattedID + "</a>";
                return formatted_string;  
            };
            
            Ext.define('CustomApp', {
                extend: 'Rally.app.App',
                field_to_sum: 'FeatureEstimate',
                componentCls: 'app',
                items: [
                    { xtype: 'container', itemId: 'grid_box', autoScroll: true },      
                    { xtype: 'container',  
                        layout: { 
                            type: 'hbox'
                        }, 
                        items: [ 
                            { xtype: 'container', margin: 5, layout: { type: 'hbox' }, items: [
            		            { xtype: 'container', margin: 5, itemId: 'edit_box' },
            		            { xtype: 'container', margin: 5, itemId: 'print_box' } 
                            ]},
                            { xtype: 'container', margin: 5, itemId: 'date_box'}
                    ]}
                ],
                selected_rows: 0,
                launch: function() {
                    window.console && console.log( "launch" );
                    this._addDatePicker();
                    this._addEditButton();
                    this._addPrintButton();
                    this._setColumns();
                	this._getPIModel();
                },
                _getBaseURL: function() {
                    var base_url = this.getContext().getWorkspace()._ref.replace(/slm[\w\W]*/,"");
                    return base_url;
                },
                _setColumns: function() {
                    var that = this;
                    this.columns = [
            	        { xtype: 'rallyrankcolumn', sortable: false },
                        { xtype: 'pxscheckcolumn', text: '&nbsp;', dataIndex: '_Selected', width: 40,
                            listeners: { 
                                checkchange: function(cc, ri, c ) {
                                    if ( c ) {
                                        that.selected_rows++;
                                    } else {
                                        that.selected_rows--;
                                    }
                                    if ( that.selected_rows > 0 ) {
                                        that.edit_button.enable();
                                    } else {
                                        that.edit_button.disable();
                                        that.selected_rows = 0;
                                    }
                                }
                            }
                        },
                        { text: ' ', dataIndex: 'Rank', width: 45, renderer: renderRank, sortable: false },
            	        { text: 'ID', dataIndex: 'FormattedID', width: 50, renderer: renderId, sortable: false },
            	        { text: 'Name', dataIndex: 'Name', editor: 'rallytextfield', flex: 2.5, sortable: false },
            	        { text: 'Running Total', dataIndex: 'RunningTotal', flex: 0.5, sortable: false  },
            	        { text: 'Feature Estimate', dataIndex: 'FeatureEstimate', editor: 'rallynumberfield', flex: 0.5, sortable: false },
            	        { text: 'Planned Start', dataIndex: 'PlannedStartDate', editor: 'rallydatefield', renderer: renderUSDate, flex: 0.75, sortable: false },
            	        { text: 'Planned End', dataIndex: 'PlannedEndDate', editor: 'rallydatefield', renderer: renderUSDate, flex: 0.75, sortable: false },
            	        { text: 'State', dataIndex: 'State', editor: this._getStateEditor(), renderer: renderFieldName, flex: 1.25, sortable: false },
            	        { text: 'Owner', dataIndex: 'Owner', renderer: renderFieldName, flex: 0.75, sortable: false },
            	        { text: 'Parent', dataIndex: 'Parent', renderer: renderFieldName, flex: 2, sortable: false }
            	    ];
                },
                _addDatePicker: function() {
                    window.console && console.log( "_addDatePicker" );
                    this.date_picker = Ext.create( 'Rally.ui.DateField',{
                        fieldLabel: 'Show Items Planned After ',
                        labelAlign: 'top',
                        labelWidth: 125,
                        stateful: true,
                        stateId: 'rallydev-pxs-runningtotal-datepicker',
                        value: Rally.util.DateTime.add( new Date(), "month", -1 ),
                        listeners: {
                            change: function( field, newValue, oldValue, eOpts ) {
                                this._getData();
                            },
                            scope: this
                        }
                    } );
                    this.down("#date_box").add(this.date_picker);
                },
                _addEditButton: function() {
                    window.console && console.log( "_addEditButton" );
                    var that = this;
                    this.edit_button = Ext.create('Rally.ui.Button', {
                        text: '',
                        icon: '/slm/images/icon_edit_view.gif',
                        disabled: true,
                        listeners: {
                            click: {
                                fn: function(){ 
                                    window.console && console.log( "click edit button", this.selected_rows);
                                    var that = this;
                                    Ext.create('Rally.pxs.dialog.FieldEditDialog', {
            						    fieldCfgs: [ 
                                            { label: 'FeatureEstimate', editor: 'rallynumberfield' },
                                            { label: 'PlannedStartDate', editor: 'rallydatefield' },
                                            { label: 'PlannedEndDate', editor: 'rallydatefield' },
                                            { label: 'State', editor: that._getStateEditor() },
                                            { label: 'Owner', editor: { xtype: 'rallyusercombobox', project: this.getContext().getProject() } }
                                        ],
            						    saveLabel: 'Save',
            						    saveFn: function(dialog, selectedField, newValue) {
                                            that.edit_button.disable();
                                            Ext.Array.each( that.pi_store.getRecords(), function( record ) {
                                                if ( record.get("_Selected")) {
                                                    window.console && console.log( "Setting ", selectedField, " to ", newValue, " for ", record.get("FormattedID"));
                                                    record.set(selectedField, newValue);
                                                    record.set("_Selected", false );
                                                    record.save();
                                                }
            		                            
            		                        });
                                            that.pi_grid.getSelectionModel().deselectAll();
            						    }
                                    }).show();
            
                                },
                                scope: this
                            }
                        }
                    });
                    
                    this.down('#edit_box').add(this.edit_button);
                },
                _addPrintButton: function() {
                    window.console && console.log( "_addPrintButton" );
                    this.down('#print_box').add(Ext.create('Rally.ui.Button', { 
                        text: 'Print',
                        listeners: {
                            click: {
                                fn: function() { this._print('grid_box'); },
                                scope: this
                            }
                        }
                    }));
                    
                },
                _getStateEditor: function() {
                    var editor = {
                        xtype: 'rallycombobox',
                        displayField: 'Name',
                        valueField: '_ref',
                        storeConfig: {
            		        autoLoad: true,
            		        model: 'State',
                            filters: [
                                { property: 'TypeDef.Name', operator: 'contains', value: 'Feature' },
                                { property: 'Enabled', operator: '=', value: 'true' }
                                ]
            		    }
                    };
                    return editor;
                },
                _getPIModel: function() {
                	Rally.data.ModelFactory.getModel({
                		type: 'PortfolioItem/Feature',
                		success: function(our_model) {
                			this.model = our_model;
                			this._getData();
                		},
                		scope: this
                	});
                },
                _getFilters: function() {
                    var filters = [ { property: 'ObjectID', operator: '>', value: '0' }];
                    if ( this.date_picker.getValue() ) {
                        var iso_value = Rally.util.DateTime.toIsoString( this.date_picker.getValue() );
                        filters = Ext.create('Rally.data.QueryFilter',
                            { property: 'PlannedEndDate', operator: '=', value: "null" }).or( Ext.create( 'Rally.data.QueryFilter',
                            { property: 'PlannedEndDate', operator: '>', value: iso_value }));
                        window.console && console.log( filters.toString() );
                        
                    }
                    return filters;
                },
                _getFetchFields: function() {
                    var fields = [];
                    Ext.Array.each( this.columns, function( col ) {
                    	if ( col && col.dataIndex ) {
                    		fields.push( col.dataIndex );
                    	}
                    });
                    return fields;
                },
                _getData: function() {
                	var that = this;
                    if ( this.date_picker ) {
            	        window.console && console.log( this.date_picker.getValue() );
            	    	this.pi_store = Ext.create('Rally.data.WsapiDataStore', {
            	    		autoLoad: true,
            	    		model: that.model,
            	            filters: that._getFilters(),
            	            sorters: [ { property: 'Rank', direction: 'ASC' } ],
            	    		listeners: {
            	    			load: function(store,data,success) {
            	                    window.console && console.log( "load" );
            	                    var records = store.getRecords();
            	                    var running_total = 0;
            	                    for ( var i=0; i<records.length; i++ ) {
            	                        var record = records[i];
            	                        var value = record.data[this.field_to_sum] || 0;
            	                        running_total += value;
            	                        record.data.RunningTotal = running_total;
                                        record.data._Selected = false;
            	                    }
            	                    
            	    				this._addPIGrid();
            	    			},
            	                datachanged: function( store, opts ) {
            	                    window.console && console.log( "data changed" );
            	                    var records = store.getRecords();
            	                    var running_total = 0;
            	                    for ( var i=0; i<records.length; i++ ) {
            	                        var record = records[i];
            	                        var value = record.data[this.field_to_sum] || 0;
            	                        running_total += value;
            	                        record.set( "RunningTotal", running_total);
            	                    }
                                    window.console && console.log( "done data changed");
            	                },
            	    			scope: this
            	    		},
            	    		fetch: that._getFetchFields()
            	    	});    
                    }
            	},
                _addPIGrid: function() {
                    window.console && console.log( "_addPIGrid" );
                	if ( this.model ) {
                        if ( this.pi_grid ) { 
                            window.console && console.log( "Already has a pi_grid" );
                            this.pi_grid.destroy();
                        } 
                		this.pi_grid = Ext.create( 'Rally.ui.grid.Grid', {
                            autoScroll: true,
                			height: 475,
                            enableEditing: false, /* cell editing puts the class on every column whether editable or not!*/
                           /* selType: 'rallyrowmodel',
                            selModel: {
                                selType: 'rallyrowmodel'
                            },*/
                			viewConfig: {
                				plugins: [
                					{ ptype: 'pxsdragdrop' }
                				]
                			},
                            plugins: [ { ptype: 'pxscellediting' } ],
            	    		columnCfgs: this.columns,
            	    		store: this.pi_store
                		});
                	    this.down('#grid_box').add(this.pi_grid);
                	}
                },
                _print: function() {
                    var that = this;
                    
                    var cols = [
                        { text: 'ID', dataIndex: 'FormattedID', width: 50 },
                        { text: 'Name', dataIndex: 'Name', editor: 'rallytextfield', flex: 2 },
                        { text: 'Running Total', dataIndex: 'RunningTotal' },
                        { text: 'Feature Estimate', dataIndex: 'FeatureEstimate' },
                        { text: 'Planned Start', dataIndex: 'PlannedStartDate', renderer: renderUSDate },
                        { text: 'Planned End', dataIndex: 'PlannedEndDate', renderer: renderUSDate },
                        { text: 'State', dataIndex: 'State',  renderer: renderFieldName },
                        { text: 'Owner', dataIndex: 'Owner', renderer: renderFieldName },
                        { text: 'Parent', dataIndex: 'Parent', renderer: renderFieldName }
                    ];
                    var hidden_window = Ext.create( 'Ext.window.Window', {
                        title: '',
                        width: 1048,
                        height: 200,
                        overflowX: 'hidden',
                        layout: 'fit',
                        items: [ { xtype: 'container', itemId: 'grid_box' } ]
                    }).show();
                    
                    print_store = Ext.create('Rally.data.WsapiDataStore', {
                        autoLoad: true,
                        model: that.model,
                        filters: that._getFilters(),
                        sorters: [ { property: 'Rank', direction: 'ASC' } ],
                        listeners: {
                            load: function(store,data,success) {
                                window.console && console.log( "load" );
                                var records = store.getRecords();
                                var running_total = 0;
                                for ( var i=0; i<records.length; i++ ) {
                                    var record = records[i];
                                    var value = record.data[this.field_to_sum] || 0;
                                    running_total += value;
                                    record.data.RunningTotal = running_total;
                                }
                                var hidden_grid = Ext.create( 'Rally.ui.grid.Grid', {
            			            model: this.model,
            			            // columnCfgs: this.columns.slice(1,this.columns.length),
                                    columnCfgs: cols,
            			            store: print_store,
                                    overflowX: 'hidden',
                                    margin: 5,
                                    layout: 'fit',
            			            showPagingToolbar: false,
            			            listeners: {
            			                viewready: function( grid, options ) {
                                            window.console && console.log( "print grid view_ready" );
            			                    var print_window = window.open('','', 'width=800,height=200');
            			                    print_window.focus();
            			                    print_window.document.write( '<html><head>');
            			                    print_window.document.write('<title>Feature Print</title>');
            			                    print_window.document.write('<link rel="Stylesheet" type="text/css" href="' + that._getBaseURL() + 'apps/2.0p5/rui/resources/css/rui.css" />');
            			                    print_window.document.write('</head>');
            			                    print_window.document.write('<body>');
            			                    print_window.document.write( hidden_grid.getEl().getHTML() );
            			                    print_window.document.write('</body>');
            			                    print_window.document.write('</html>'); 
            			                    
            			                    hidden_window.hide();
            			                    print_window.print();
                                            print_window.close();
            			                }
            			            }
            			        });
                                hidden_window.down('#grid_box').add( hidden_grid );
                            },
                            scope: this
                        },
                        fetch: that._getFetchFields()
                    });  
                },
                _printOld: function( element_name ) {
                    var printElement = this.down('#'+element_name);
                    var printWindow = window.open('','', 'width=400,height=200');
                    printWindow.document.write( '<html><head>');
                    printWindow.document.write('<title>Feature Print</title>');
                    printWindow.document.write('<link rel="Stylesheet" type="text/css" href="' + this._getBaseURL() + 'apps/2.0p5/rui/resources/css/rui.css" />');
                    
                    printWindow.document.write('</head><body>');
                    printWindow.document.write(printElement.el.dom.innerHTML);
                    printWindow.document.write('</body></html>');
                    printWindow.print();
                }
            });

            Rally.launchApp('CustomApp', {
                name: 'RunningTotal'
            });
        });
    </script>

    <style type="text/css">
        .app {
             /* Add app styles here */
        }
        
        .rally-edit-cell-over {
        	background-image: url('/slm/js/rally/resources/images/editIcon.png');
        	background-position: right 2px;
        	background-repeat: no-repeat;
        }
        
        .pxs-grid-checker {
        	background-repeat: no-repeat;
        	background-position:center;
        	background-image: url('/apps/2.0p5/ext/4.1.1/resources/themes/images/default/grid/unchecked.gif');
        }
        
        .pxs-grid-checked {
        	background-repeat: no-repeat;
        	background-position:center;
        	background-image: url('/apps/2.0p5/ext/4.1.1/resources/themes/images/default/grid/checked.gif');
        }    </style>
</head>
<body></body>
</html>
