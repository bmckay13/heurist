/**
* Search header for DefTerms manager
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

$.widget( "heurist.searchRecUploadedFiles", $.heurist.searchEntity, {

    //
    _initControls: function() {
        this._super();
        
        var that = this;
            
        this.selectGroup = this.element.find('#sel_group');
        
        //only one domain to show - as specified in options
        if(!window.hWin.HEURIST4.util.isempty(this.options.filter_groups) && this.options.filter_groups.indexOf(',')<0){
            this.options.filter_group_selected = this.options.filter_groups;
            this.selectGroup.hide();
        }
        this.selectGroup.css({position:'absolute','height':'1.8em','bottom':0});
        this.selectGroup.tabs();
        if(!window.hWin.HEURIST4.util.isempty(this.options.filter_group_selected)){
                this.selectGroup.tabs('option','active',this.options.filter_group_selected=='external'?1:0);
        }
        this.selectGroup.find('ul').css({'background':'none','border':'none'});
        this.selectGroup.css({'background':'none','border':'none'});
        
        this._on( this.selectGroup, { tabsactivate: this.startSearch  });
        
        //-----------------
        this.input_search_path = this.element.find('#input_search_path');
        this.input_search_type = this.element.find('#input_search_type');
        this.input_search_url =  this.element.find('#input_search_url');
        
        //this._on(this.input_search,  { keyup:this.startSearch });
        //this._on(this.input_search_path,  { keyup:this.startSearch });
        //this._on(this.input_search_code,  { keyup:this.startSearch });
        this._on( this.input_search_url, { keypress: this.startSearchOnEnterPress });
        this._on( this.input_search_path, { keypress: this.startSearchOnEnterPress });
        this._on( this.input_search_code, { keypress: this.startSearchOnEnterPress });

                      
        this.startSearch();            
    },  

    //
    // public methods
    //
    startSearch: function(){
        
            this._super();
            
            var request = {}
        
            var domain = this.currentDomain();

            if(domain=='external'){

                this.input_search.parent().hide();
                this.input_search_path.parent().hide();
                this.input_search_url.parent().show();

                if(this.input_search.val()!=''){
                    request['ulf_ExternalFileReference'] = this.input_search_url.val();    
                }else{
                    request['ulf_ExternalFileReference'] = '-NULL';                        
                }
                
            }else{
                
                this.input_search_url.parent().hide();
                this.input_search.parent().show();
                this.input_search_path.parent().show();
                request['ulf_ExternalFileReference'] = 'NULL';
                
                if(this.input_search_path.val()!=''){
                    request['ulf_FilePath'] = this.input_search_path.val();    
                }
                if(this.input_search.val()!=''){
                    request['ulf_OrigFileName'] = this.input_search.val();    
                }
            }
            if(this.input_search_type.val()!=''){
                    request['ulf_Parameters'] = this.input_search_type.val();    
            }
            
            
            if(false && $.isEmptyObject(request)){
                this._trigger( "onresult", null, {recordset:new hRecordSet()} );
            }else{
                this._trigger( "onstart" );
        
                request['a']          = 'search'; //action
                request['entity']     = this.options.entity.entityName;
                request['details']    = 'id'; //'id';
                request['request_id'] = window.hWin.HEURIST4.util.random();
                
                request['DBGSESSID'] = '423997564615200001;d=1,p=0,c=0';

                var that = this;                                                
                
                window.hWin.HAPI4.EntityMgr.doRequest(request, 
                    function(response){
                        if(response.status == window.hWin.HAPI4.ResponseStatus.OK){
                            that._trigger( "onresult", null, 
                                {recordset:new hRecordSet(response.data), request:request} );
                        }else{
                            window.hWin.HEURIST4.msg.showMsgErr(response);
                        }
                    });
                    
            }            
    },
    
    currentDomain:function(){
            var domain = this.selectGroup.tabs('option','active');
            return domain==1?'external':'local';
    },
    

});