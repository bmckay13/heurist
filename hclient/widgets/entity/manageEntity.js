/**
* manageEntity.js - BASE widget
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2016 University of Sydney
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @version     4.0
*/

/*  
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
* with the License. You may obtain a copy of the License at http://www.gnu.org/licenses/gpl-3.0.txt
* Unless required by applicable law or agreed to in writing, software distributed under the License is
* distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
* See the License for the specific language governing permissions and limitations under the License.
*/

//
// METHODS
//        
//_initControls - add panels and init ui elements
//_onActionListener - central listener for action events
//_defineActionButton
//_rendererActionButton  - renderer of item for resultlist
//_recordListHeaderRenderer  - renderer of header for resultlist
//_recordListItemRenderer    - renderer of item for resultlist
//_recordListGetFullData     - callback function to retrieve full record info (in case we use 2 steps search: ids then list per page)  
//_initDialog - init dialog widget 
// popupDialog
// closeDialog

//_selectAndClose - event handler for select-and-close (select_multi) or for any selection event for select_single
// selectedRecords get and set selected records 
    
//updateRecordList - listener of onresult event generated by searchEtity
//filterRecordList - listener of onfilter event generated by searchEtity. appicable for use_cache only       
//getRecordSet - get subset of current recordset by Ids
    

// EDIT 
// _getValidatedValues - returns values from edit form
// _afterSaveEventHandler
// _saveEditAndClose - send update request and close popup edit dialog

// _afterInitEditForm perform required after edit form init modifications (show/hide fields, assign even listener )
// _addEditRecord - call _initEditForm and popup edit dialog

// _afterDeleteEvenHandler
//  _deleteAndClose

$.widget( "heurist.manageEntity", {

    // default options
    options: {
    
        //DIALOG section       
        isdialog: false,     // show as dialog @see  _initDialog(), popupDialog(), _closeDialog
        dialogcleanup: true, // remove dialog div on close
        height: 400,
        width:  760,
        modal:  true,
        title:  '',
        
        //LIST section 
        pagesize: 100,      // page size in resultList 
        list_header: false, // show header in list mode (@todo implement)
        list_mode:'default', // use standard resultList widget (for example in defTerms we use treeview)
        
        //SEARCH/filter section
        use_cache: false,   // search performed once and then we apply local filter  @see updateRecordList, filterRecordList
        //initial search/filter values by title and subset of groups to search
        filter_title: null,
        filter_group_selected:null,
        filter_groups: null,

        //EDIT section
        edit_mode:'inline', //'popup', 'none'
        edit_height:null,
        edit_width :null,
        edit_title :null,
        edit_need_load_fullrecord: false, //if for edit form we need to load full(all data) record
        
        layout_mode:'basic', //short wide  or valid html snippet
        
        // manager - all selection ui (buttons, checkboxes, label with number of sel.records) is hidden
        //        highlight in list works as usual and selected records are used in actions
        // select_single - in list only one item can be highlighted, in dialog mode it will be closed
        // select_multi - several items can be highlighted, chekboxes are visible in list, onselect works only if button prerssed
        select_mode: 'manager', //'select_single','select_multi','manager'

        selectbutton_label: 'Select',  //@todo remove?? 
        
        
        //it either loaded from server side if _entityName defined or defined explicitely on client side
        entity: {}       //configuration
    },
    
    //system name of entity  - define it to load entity config from server
    _entityName: '', 
    
    //selected records hRecordSet
    _selection:null,
    //cached records hRecordSet
    _cachedRecordset:null,
    //reference to edit form
    _editing:null,

    _currentEditID:null,
    
    // the widget's constructor
    _create: function() {
        // prevent double click to select text
        this.element.disableSelection();
    }, //end _create
    
    //
    //  load configuration and call _initControls
    //
    _init: function() {

        if(this.options.isdialog){  //show this widget as popup dialog
            this._initDialog();
        }
        
        //init layout
        var layout = '';
        if(this.options.layout_mode=='basic'){  //tooolbar on top, list on left, edit form on right side
            layout = 
                '<div class="ent_wrapper">'
                    +'<div class="ent_header editForm-toolbar"/>'
                    +'<div class="ent_content_full recordList" style="width:250px"/>'
                    +'<div class="ent_content_full editForm" style="left:251px"/>'
                +'</div>';
        
        }else if(this.options.layout_mode=='short'){ //short search form above the list, viewer/editor on right side
        
            layout = 
                '<div class="ent_wrapper">'
                        +'<div class="ent_wrapper" style="width:200px">'
                        +    '<div class="ent_header searchForm"/>'     
                        +    '<div class="ent_content_full recordList"/>'
                        +'</div>'
                        +'<div class="ent_wrapper" style="left:201px">'
                        +    '<div class="ent_header editForm-toolbar"/>'
                        +    '<div class="ent_content_full editForm"/>'
                        +'</div>'
                +'</div>';
        
        
        }else if(this.options.layout_mode=='wide'){ //wide search form

        
        }else{ //custom layout - must contain valid html snippet
            layout = this.options.layout_mode;
        }
        try{
            $(layout).appendTo(this.element);
        }catch(e){
            this.element.html('Cannot init layout. Please contact developers')
            return;
        }
        
        //find 3 elements searchForm, recordList+recordList_toolbar, editForm+editForm_toolbar
        this.recordList = this.element.find('.recordList');
        //this.recordListToolbar = this.element.find('.recordList');
        this.searchForm      = this.element.find('.searchForm');
        this.editForm        = this.element.find('.editForm');
        this.editFormToolbar = this.element.find('.editForm-toolbar');
        
        this.element.addClass('ui-heurist-bg-light');
        
        
        this.editForm.html('<div class="center-message">Select an entity in the list to edit</div>');

        
        if(!window.hWin.HEURIST4.util.isempty(this._entityName)){
            //entity should be loaded from server
            var that = this;
            window.hWin.HAPI4.EntityMgr.getEntityConfig(this._entityName, 
                    function(entity){
                        that.options.entity = entity;
                        that._initControls();
                    });
            return;
        }else{
            //entity already defined or set via options
            this._entityName = this.options.entity['entityName'];
            this._initControls();
        }
    },
      
    //  
    // invoked from _init after loading of entity configuration    
    // in base widget: init resultList, adds search and edit panels
    // in descendat: init ui listeners and init searchEntity
    //
    _initControls:function(){
        
        if(!this._entityName || $.isEmptyObject(this.options.entity)){
            return false;
        }
        
        var that = this;

        
        if(this.options.list_mode=='default'){
        
                //init record list
                this.recordList
                    .resultList({
                       eventbased: false, 
                       isapplication: false, //do not listent global events @todo merge with eventbased
                       multiselect: (this.options.select_mode!='select_single'), //@todo replace to select_mode

                       select_mode: this.options.select_mode,
                       selectbutton_label: this.options.selectbutton_label,
                       
                       pagesize:(this.options.pagesize>0) ?this.options.pagesize: 9999999999999,
                       empty_remark: 
                            (this.options.select_mode!='manager')
                            ?'<div style="padding:1em 0 1em 0">'+this.options.entity.empty_remark+'</div>'
                            :'',
                       searchfull: function(arr_ids, pageno, callback){
                           that._recordListGetFullData(arr_ids, pageno, callback);
                       },//this._recordListGetFullData,    //search function 
                       renderer: function(recordset, record){ 
                                return that._recordListItemRenderer(recordset, record);  //custom render for particular entity type
                            },
                       rendererHeader: this.options.list_header ?function(){
                                return that._recordListHeaderRenderer();  //custom header for list mode (table header)
                                }:null
                               
                                });     

                this._on( this.recordList, {
                        "resultlistonselect": function(event, selected_recs){
                                    this.selectedRecords(selected_recs);
                                    
                                    if (this.options.edit_mode=='inline'){
                                            this._onActionListener(event, {action:'edit'}); //default action of selection
                                    }
                                }
                        });
                this._on( this.recordList, {
                        "resultlistonaction": this._onActionListener});
                        
        }        
        
       //---------    EDITOR PANEL
       //if actions allowed - add div for edit form exists - it may be shown as right-hand panel or in modal popup
       if(this.options.edit_mode!='none'){
            if(this.options.edit_mode=='inline'){
/* @todo align toolbar in list and editor for wide layout mode
               if(this.recordList){
                   this.recordList.css('width','250px');
                   var list_container = this.recordList.find('.div-result-list-content');
                   
                   this.ent_editor_wrapper.css({'left':'250px'})
                   //align with recordList header
                   this.editForm.css({'border-top':'1px solid #cccccc',
                                        top:list_container.css('top')});

               }
               this.ent_editor_wrapper.show();
*/               
            }else{
               //this.ent_editor_wrapper.addClass('ui-heurist-bg-light').css({'overflow':'hidden'}).hide(); 
            }
       }

        //--------------------------------------------------------------------    

        var ishelp_on = window.hWin.HAPI4.get_prefs('help_on')==1;
        $('.heurist-helper1').css('display',ishelp_on?'block':'none');

        
        //init hint and help buttons on dialog titlebar
        if(this.options.isdialog){
            window.hWin.HEURIST4.ui.initDialogHintButtons(this.element,
             window.hWin.HAPI4.baseURL+'context_help/'+this.options.entity.helpContent+' #content');
             
             //construct entity from config
             if(window.hWin.HEURIST4.util.isempty(this.options.title)){
                    var title = window.hWin.HR(this.options['select_mode']=='manager'?'Manage':'Select') + ' ' +
                        (this.options['select_mode']=='select_single'
                                    ?this.options.entity.entityTitle
                                    :this.options.entity.entityTitlePlural);
                                    
                    this.element.dialog('option','title',title);                                     
             }
        }
        
        return true;
        //place this code in extension ===========    
        /* init search header
        this.searchForm.searchSysGroups(this.options);
            
        this._on( this.searchForm, {
                "searchsysgroupsonresult": this.updateRecordList
                });
       */         
        //extend ===========    
        
        
    },

    //Called whenever the option() method is called
    //Overriding this is useful if you can defer processor-intensive changes for multiple option change
    _setOptions: function( ) {
        this._superApply( arguments );
    },

    /* 
    * private function 
    * show/hide buttons depends on current login status
    */
    _refresh: function(){

    },
    // 
    // custom, widget-specific, cleanup.
    _destroy: function() {
        // remove generated elements
        if(this.searchForm) this.searchForm.remove();
        if(this.recordList) this.recordList.remove();
        if(this.editForm) this.editForm.remove();

        this.wrapper.remove();
        this._selection = null;
    },
    
    //----------------------
    //
    // listener of action button/menu clicks - central listener for action events
    //
    _onActionListener:function(event, action){
        if(action=='select-and-close'){
             this._selectAndClose();
             return true;
        } else {
             var recID = 0;
             if(action && action.action){
                 recID =  action.recID;
                 action = action.action;
             }
             if(action=='add'){
                    this._addEditRecord(-1);
                    return true;
             }else if(action=='delete'){
                    this._deleteAndClose(); 
             }
            
             var s = 'User clicked action "'+action+'" for ';
             if(recID>0){
                 s = s + 'rec# '+recID;
                 
              //take records ID from selection   
             }else if(window.hWin.HEURIST4.util.isRecordSet(this._selection) && this._selection.length()>0){
                 s = s + this._selection.length() + ' selected record';
                 var recs = this._selection.getOrder();
                 recID = recs[recs.length-1];
             }else{
                 s = 'Nothing selected';
                 recID = null;
             }
             
             if(action=='edit'){
                    this._addEditRecord(recID);
                    return true;
             }else if(action=='save'){
                    this._saveEditAndClose();
                    return true;
             }else{
                    //window.hWin.HEURIST4.msg.showMsgFlash(s);  
             }
        }
        return false;
    },
    
    //----------------------
    //
    // helper function that creates button for given action
    //
    // action = {key, label, title, icon}
    // mode - full|small|icon|icon_text - full is default mode
    _defineActionButton: function(action, container, mode, style){        
        
        if(!style) style = {};
        if(!action.icon) action.icon = '';
        action.title = (!action.title)?'':window.hWin.HR(action.title);

        if(mode=='icon_text'){ //for resultList item

            var res = '<div title="'+action.title
            +'" class="logged-in-only" role="button" aria-disabled="false" data-key="'+action.key+'">';

                    if(action.icon){
                        res = res + '(<span class="ui-icon '+action.icon+'"></span>';    
                    }else{
                        res = res + window.hWin.HR(action.label);
                    }
            res = res + '</div>';
        
            return res;
        }else {
            if(!container) return;
            var btn;
            
            if(mode=='icon'){
                
                    //class="item inlist logged-in-only" '
                    btn = $('<div>',{title:action.title, 'aria-disabled':false, 'data-key':action.key})
                            .css(style)
                            .appendTo(container);
                    if(action.icon){
                        btn.html('(<span class="ui-icon '+action.icon+'"></span>');    
                    }else{
                        btn.html(window.hWin.HR(action.label));
                    }
                
            }else{
                
                    btn = $('<div>',{'data-key':action.key}).button(
                            {icons: {primary: action.icon}, 
                             text: (mode!='small'), 
                             title: action.title, 
                             label: window.hWin.HR(action.label) })
                    .css(style)         
                    .appendTo(container);
                    
                    if(mode=='small'){
                        btn.css('width','16px');
                    }
                    
            }        
            this._on(btn, {'click':function( event ) {
                        var key = $(event.target).parent().attr('data-key');
                        this._onActionListener(null, key);
                        //that._trigger( "onaction", null, key );
                    }});
        }
        
    },
    
    // @todo  to remove
    _rendererActionButton: function(action, isheader){        
        if(window.hWin.HEURIST4.util.isArrayNotEmpty(this.options.action_select)){        
        //if(this.options.select_mode=='manager'){
            var idx = 0;
            for(idx in this.options.action_select){
                var act = this.options.action_select[idx];
                if(action == act.key)
                {
                    if(isheader==true){

                        return '<div title="' + (act.hint?act.hint:'')
                            +'" style="display:inline-block;border-right:1px solid;width:3em">'
                            +act.title+'</div>';
                        
                    }else{
                        
                        var icon = act.icon;
                        if(window.hWin.HEURIST4.util.isempty(act.icon)){
                            //by default only edit,delete buttons allowed - otherwise need specify icon 
                            //on entity configuration file
                            if(action=='edit'){
                                icon = 'ui-icon-pencil';
                            }else if(action=='delete'){
                                icon = 'ui-icon-circle-close';
                            }else{
                                return ''; 
                            }
                        }
                    
                        return '<div title="'
                            + (act.hint?act.hint:act.title)
                            +'" class="item inlist logged-in-only" '
                            +'style="width:3em" role="button" aria-disabled="false" data-key="'+act.key+'">'
                            +'<span class="ui-icon '+icon+'"></span>'
                            + '</div>';
                    }
                }
            }               
        }
        
        return '';
        
    },
        
    //
    // custom renderer for resultList header
    //
    _recordListHeaderRenderer:function(){
        //TO EXTEND        
        return '';
    },
    
    //
    // renderer of item for resultlist
    //
    _recordListItemRenderer:function(recordset, record){
        //TO EXTEND        
    },

    //
    // callback function to retrieve full record info (incase we use 2 steps search: ids then list per page)  
    //
    _recordListGetFullData:function(arr_ids, pageno, callback){

        var request = {
                'a'          : 'search',
                'entity'     : this.options.entity.entityName,
                'details'    : 'list',
                'pageno'    : pageno
        };
        
        request[this.options.entity.keyField] = arr_ids;
        
        //request[this.options.entity] = arr_ids;
        
        window.hWin.HAPI4.EntityMgr.doRequest(request, callback);
    },
    

    //
    // init dialog widget 
    //
    _initDialog: function(){
        
            var options = this.options,
                btn_array = [],
                    that = this;
        
            //dialog buttons SELECT and CLOSE
            if(options['select_mode']=='select_multi'){ 
                btn_array.push({text:window.hWin.HR( options['selectbutton_label'] ),
                        click: function() { that._selectAndClose(); }}); 
            }
            btn_array.push({text:window.hWin.HR('Close'), 
                    click: function() { that.closeDialog(); }}); 
                    
                    
            var $dlg = this.element.dialog({
                autoOpen: false ,
                height: options['height'],
                width:  options['width'],
                modal:  (options['modal']!==false),
                title: window.hWin.HEURIST4.util.isempty(options['title'])?'':options['title'], //title will be set in  initControls as soon as entity config is loaded

                resizeStop: function( event, ui ) {//fix bug
                    that.element.css({overflow: 'none !important','width':that.element.parent().width()-24 });
                },
                
                close: function(event, ui){
                       if(options['dialogcleanup']){
                           $dlg.remove();
                       }
                            
                },
                buttons: btn_array
            });  
            
    },
    
    //
    // show dialog
    //
    popupDialog: function(){
        if(this.options.isdialog){
            this.element.dialog("open");
        }
    },
    
    //
    // close dialog
    //
    closeDialog: function(){
        if(this.options.isdialog){
            this.element.dialog('close');
        }
    },

    //
    // event handler for select-and-close (select_multi)
    // or for any selection event for select_single
    // triger onselect event
    //
    _selectAndClose: function(){
        
        if(window.hWin.HEURIST4.util.isRecordSet(this._selection)){
            //window.hWin.HAPI4.save_pref('recent_Users', this._selection.getIds(25), 25);      
            this._trigger( "onselect", null, {selection:this._selection.getIds()});
        }else{        
            this._trigger( "onselect", null, null );
        }
        this.closeDialog();
    },

    //
    // get and set selected records - RecordSet
    //    
    selectedRecords: function(value){
        
        if(window.hWin.HEURIST4.util.isnull(value)){
            //getter
            return this._selection;
        }else{
            
            if($.isArray(value)){
                if(this._cachedRecordset){
                    value = this._cachedRecordset.getSubSetByIds(value);
                }else{
                    value = null;
                }
            }
            //setter
            this._selection = value;
            
            if(this.options.select_mode=='select_single'){
                this._selectAndClose();
            }
        }
/*        
            if(this._editing.isModified()){
                window.hWin.HEURIST4.msg.showMsgDlg('Data were modified. Ignore and load data for selected record',
                function(){ that._initEditForm_continue(recID); },
                'Confirm');
*/        
        
    },
    
    //--------------- WORK WITH LIST
    //
    // listener of onresult event generated by searchEtity
    //
    updateRecordList: function( event, data ){
        if (data){
            if(this.options.use_cache){
                this._cachedRecordset = data.recordset;
            }else if(this.options.list_mode=='default'){
                this.recordList.resultList('updateResultSet', data.recordset, data.request);
            }
        }
    },

    //
    // listener of onfilter event generated by searchEtity. appicable for use_cache only       
    //
    filterRecordList: function(event, request){
        if(this.options.use_cache){
            var subset = this._cachedRecordset.getSubSetByRequest(request, this.options.entity.fields);
            if(this.options.list_mode=='default'){
                this.recordList.resultList('updateResultSet', subset, request);   
            }
        }
    },

    //
    // get subset of current recordset by Ids
    //
    getRecordSet: function(recIDs){
        if(this.options.use_cache){
            return this._cachedRecordset.getSubSetByIds(recIDs);
        }else if(this.options.list_mode=='default'){
            return this.recordList.resultList('getRecordsById', recIDs);
        }
    },
    
    //  -----------------------------------------------------
    //
    //  1. returns values from edit form
    // 2. performs special action for virtual and hidden fields 
    // fill them with constructed and/or predefined values
    // EXTEND this method to set values for hidden fields (for example parent term_id or group/domain)
    //
    _getValidatedValues: function(){
        
        if(this._editing.validate()){
            return this._editing.getValues(false);    
        }else{
            return null;
        }
    },
    

    //  -----------------------------------------------------
    //
    //  after save event handler
    //
    _afterSaveEventHandler: function( recID, fieldvalues ){
        
            this._currentEditID = null;
            window.hWin.HEURIST4.msg.showMsgFlash(window.hWin.HR('Record has been saved'));
            if(this.options.edit_mode=='popup'){
                this.editForm.dialog('close');
            }
            
            if(this.options.use_cache){
                //refresh item in list
                if(this.options.list_mode=='default'){
                    this.recordList.resultList('refreshPage');  
                }
            }
            
    },
    
    //  -----------------------------------------------------
    //
    //  send update request and close popup if edit is in dialog
    //
    _saveEditAndClose: function(){

            var fields = this._getValidatedValues(); 
            
            if(fields==null) return; //validation failed
        
            var request = {
                'a'          : 'save',
                'entity'     : this.options.entity.entityName,
                'request_id' : window.hWin.HEURIST4.util.random(),
                'fields'     : fields                     
                };
                
                var that = this;                                                
                //that.loadanimation(true);
                window.hWin.HAPI4.EntityMgr.doRequest(request, 
                    function(response){
                        if(response.status == window.hWin.HAPI4.ResponseStatus.OK){

                            var recID = ''+response.data[0];
                            
                            //update record in cache
                            if(that.options.use_cache){
                                fields[ that.options.entity.keyField ] = recID;
                                that._cachedRecordset.addRecord(recID, fields);
                            }
                            
                            that._afterSaveEventHandler( recID, fields );
                            
                        }else{
                            window.hWin.HEURIST4.msg.showMsgErr(response);
                        }
                    });
    },       

    //  -----------------------------------------------------
    //
    //  after save event handler
    //
    _afterDeleteEvenHandler: function( recID ){
        
            this._currentEditID = null;
            window.hWin.HEURIST4.msg.showMsgFlash(window.hWin.HR('Record has been deleted'));
            if(this.options.edit_mode=='popup'){
                //hide popup edit form 
                this.editForm.dialog('close');
            }else{
                //hide inline edit form 
                this._addEditRecord(null);
            }
            
            if(this.options.use_cache){
                //refresh item in list
                if(this.options.list_mode=='default'){
                    this.recordList.resultList('refreshPage');  
                }
            }
    },
    
    //  -----------------------------------------------------
    //
    //  delete emtity and close popup if edit is dialog
    //
    _deleteAndClose: function(){
        
            if(!(this._currentEditID>0)) return;

            var request = {
                'a'          : 'delete',
                'entity'     : this.options.entity.entityName,
                'request_id' : window.hWin.HEURIST4.util.random(),
                'recID'      : this._currentEditID                     
                };
                
                var that = this;                                                
                
                window.hWin.HAPI4.EntityMgr.doRequest(request, 
                    function(response){
                        if(response.status == window.hWin.HAPI4.ResponseStatus.OK){

                            var recID = that._currentEditID;
                            if(that.options.use_cache){
                                that._cachedRecordset.removeRecord( recID );
                            }
                            that._afterDeleteEvenHandler( recID );
                            
                        }else{
                            window.hWin.HEURIST4.msg.showMsgErr(response);
                        }
                    });
    },       
    
    //  -----------------------------------------------------
    //
    //
    _initEditForm: function(recID){

        if(!this._editing){
            this._editing = new hEditing(this.editForm); //pass container
            this._initEditForm_continue(recID);
        }else{
            var that = this;
            if(this._currentEditID!=null && this._editing.isModified()){
                window.hWin.HEURIST4.msg.showMsgDlg('Data were modified. Ignore and load data for selected record',
                function(){ that._initEditForm_continue(recID); },
                'Confirm');
            }else{
                this._initEditForm_continue(recID);            
            }
        }
    },

    _initEditForm_continue: function(recID){
        //fill with values
        this._currentEditID = recID;
        
        if(recID==null){
            this._editing.initEditForm(null, null); //clear and hide
        }else{

            if(recID>0){ //edit existing record
                if(this.options.edit_need_load_fullrecord){
                    
                    //get primary key field
                    if(!this.options.entity.keyField) return alert('Developer! Define fieldname for ID in entity configuration file!!!');
                    
                    var request = {'a': 'search',
                        'entity': this.options.entity.entityName,  //'defDetailTypes'
                        'details': 'full',
                        'request_id': window.hWin.HEURIST4.util.random()
                    }
                    request[this.options.entity.keyField] = recID;
                    
                    var that = this;                                                
                    
                    window.hWin.HAPI4.EntityMgr.doRequest(request, 
                        function(response){
                            if(response.status == window.hWin.HAPI4.ResponseStatus.OK){
                                var recordset = new hRecordSet(response.data);
                                
                                that._editing.initEditForm(that.options.entity.fields, recordset);
                                that._afterInitEditForm();
                            }else{
                                window.hWin.HEURIST4.msg.showMsgErr(response);
                            }
                        });
                        
                    return;    
                
                }else{
                    var recordset = this.getRecordSet([recID]);
                    this._editing.initEditForm(this.options.entity.fields, recordset);
                }
            }else if(recID<0){
                // add new record
                this._editing.initEditForm(this.options.entity.fields, null);
            }
            
            this._afterInitEditForm();
        
        }
        
        return;
    },
    
    //-----
    // perform required after edit form init modifications (show/hide fields, assign event listener )
    // for example hide/show some fields based on value of field
    //
    _afterInitEditForm: function(){

        if(this.options.edit_mode=='inline'){
            //@todo reduce it in css                 
            this.editForm.find('.header').css({'min-width':'100px','width':'100px'});
            
            //add save button at the end of edit form
            this._defineActionButton({key:'save',label:'Save', title:'', icon:'ui-icon-check'},
                        this.editForm,'full',{margin:'0 40%'});
        }

        // to EXTEND         
    },

    //
    // show edit form in popup dialog or rigth-hand panel
    //
    _addEditRecord: function(recID){
        
        if(this.options.edit_mode == 'none') return;
        
        this._initEditForm(recID);
        
        if(recID!=null && this.options.edit_mode=='popup'){ //show in popup

            var that = this; 
        
            var btn_array = [{text:window.hWin.HR('Save'),
                        click: function() { that._saveEditAndClose(); }},
                              {text:window.hWin.HR('Close'), 
                    click: function() { that.editForm.dialog('close'); }}]; 
             
            this.editForm.dialog({
                autoOpen: true,
                height: this.options['edit_height']?this.options['edit_height']:400,
                width:  this.options['edit_width']?this.options['edit_width']:740,
                modal:  true,
                title: this.options['edit_title']
                            ?this.options['edit_title']
                            :window.hWin.HR('Edit') + ' ' +  this.options.entity.entityName,
                resizeStop: function( event, ui ) {//fix bug
                    that.element.css({overflow: 'none !important','width':that.element.parent().width()-24 });
                },
                buttons: btn_array
            });        
            
        }
        
        
    }
    
    
});

