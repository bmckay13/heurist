/*
* editSymbology.js - edit map symbol properties 
* 
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2019 University of Sydney
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

function editSymbology(current_value, mode_edit, callback){

    var edit_dialog = null;
    
    var popup_dlg = $('#heurist-dialog-editSymbology');

    if(popup_dlg.length>0){
        popup_dlg.empty();
    }else{
        popup_dlg = $('<div id="heurist-dialog-editSymbology">')
            .appendTo( $(window.hWin.document).find('body') );
    }

    var editForm = $('<div class="ent_content_full editForm" style="top:0">')
    .appendTo($('<div class="ent_wrapper">').appendTo(popup_dlg));

    var _editing_symbology = new hEditing({container:editForm, 
        onchange:
        function(){
            var isChanged = _editing_symbology.isModified();
            var mode = isChanged?'visible':'hidden';
            edit_dialog.parent().find('#btnRecSave').css('visibility', mode);

            if(isChanged){

                var ele = _editing_symbology.getFieldByName('iconType');
                var res = ele.editing_input('getValues'); 
                var ele_icon_url = _editing_symbology.getFieldByName('iconUrl').hide();
                var ele_icon_font = _editing_symbology.getFieldByName('iconFont').hide();
                if(res[0]=='url'){
                    ele_icon_url.show();
                }else if(res[0]=='iconfont'){
                    ele_icon_font.show();
                }

            }

    }});
    
    var recdata = current_value ? new hRecordSet({count:1, order:[1], 
        records:{1:current_value}, 
        fields: {'stub':0}}) :null;
        //Object.getOwnPropertyNames(current_value)

        
    /*
    iconUrl: 'my-icon.png',
    iconSize: [38, 95],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76],
    shadowUrl: 'my-icon-shadow.png',
    shadowSize: [68, 95],
    shadowAnchor: [22, 94]     

    for divIcon
    color
    fillColor
    animation
    */                    
    _editing_symbology.initEditForm([                
        {"dtID": "sym_Name",
            "dtFields":{
                "dty_Type":"freetext",
                //"rst_RequirementType":"required",                        
                "rst_DisplayName":"Name:",
                "rst_Display": (mode_edit===true)?"visible":"hidden"
        }},

        {"dtID": "iconType",
            "dtFields":{
                "dty_Type":"enum",
                "rst_DisplayName": "Icon source:",
                "rst_DefaultValue": "y",
                "rst_DisplayHelpText": "Define type and source of icon",
                "rst_Display": (mode_edit!=2)?"visible":"hidden",
                "rst_FieldConfig":[
                    {"key":"url","title":"Image"},
                    {"key":"iconfont","title":"Icon font"},
                    {"key":"circle","title":"Circle"},
                    {"key":"rectype","title":"Record type icon"} //change to thematic mapping
                    //{"key":"","title":"Default marker"}
                ]
        }},
        {"dtID": "iconUrl",
            "dtFields":{
                "dty_Type":"url",
                "rst_DisplayName": "Icon URL:",
                "rst_DisplayWidth":40,
                "rst_Display":(mode_edit!=2 && current_value['iconType']=='url'?"visible":"hidden")
        }},
        {"dtID": "iconFont",
            "dtFields":{
                "dty_Type":"freetext",
                "rst_DisplayName": "Icon:",
                "rst_DisplayWidth":40,
                "rst_Display":(current_value['iconType']=='iconfont'?"visible":"hidden"),
                "rst_DefaultValue": "location",
                "rst_Display": (mode_edit!=2)?"visible":"hidden",
                "rst_DisplayHelpText": "Define name of icon from set: http://mkkeck.github.io/jquery-ui-iconfont/"
        }},
        {"dtID": "iconSize",
            "dtFields":{
                "dty_Type":"integer",
                "rst_DisplayName": "Icon size:",
                "rst_Display": (mode_edit!=2)?"visible":"hidden"
                //"rst_DefaultValue": 18,
        }},

        {"dtID": "stroke",
            "dtFields":{
                "dty_Type":"enum",
                "rst_DisplayName": "Stroke:",
                "rst_DefaultValue": "1",
                "rst_DisplayHelpText": "Whether to draw stroke along the path. Set it to false to disable borders on polygons or circles.",
                "rst_FieldConfig":[
                    {"key":"0","title":"No"},
                    {"key":"1","title":"Yes"}
                ],
                "rst_Display": (mode_edit!=2)?"visible":"hidden"
        }},
        {"dtID": "color",
            "dtFields":{
                "dty_Type":"freetext",
                "rst_DisplayName": "Stroke color:",
                "rst_DisplayHelpText": "",
                "rst_FieldConfig":{"colorpicker":"colorpicker"}  //use colorpicker widget
        }},
        {"dtID": "weight",
            "dtFields":{
                "dty_Type":"integer",
                "rst_DisplayName": "Stroke width:",
                "rst_DisplayHelpText": "Stroke width in pixels"
        }},
        {"dtID": "opacity",
            "dtFields":{
                "dty_Type":"float",
                "rst_DisplayName": "Stroke opacity:",
                "rst_DisplayHelpText": ""
        }},
        /*                    
        lineCap    String    'round'    A string that defines shape to be used at the end of the stroke.
        lineJoin    String    'round'    A string that defines shape to be used at the corners of the stroke.
        dashArray    String    null    A string that defines the stroke dash pattern. Doesn't work on Canvas-powered layers in some old browsers.
        dashOffset    String    null    A string that defines the distance into the dash pattern to start the dash. Doesn't work on Canvas-powered layers in some old browsers.
        */                    
        {"dtID": "fill",
            "dtFields":{
                "dty_Type":"enum",
                "rst_DisplayName": "Fill:",
                "rst_DisplayHelpText": "Whether to fill the path with color. Set it to false to disable filling on polygons or circles.",
                "rst_DefaultValue": "1",
                "rst_FieldConfig":[
                    {"key":"0","title":"No"},
                    {"key":"1","title":"Yes"}
                ],
                "rst_Display": (mode_edit!=2)?"visible":"hidden",
        }},
        {"dtID": "fillColor",
            "dtFields":{
                "dty_Type":"freetext",
                "rst_DisplayName": "Fill color:",
                "rst_DisplayHelpText": "Fill color. Defaults to the value of the color option",
                "rst_FieldConfig":{"colorpicker":"colorpicker"}  //use colorpicker widget
        }},
        {"dtID": "fillOpacity",
            "dtFields":{
                "dty_Type":"float",
                "rst_DisplayName": "Fill opacity:",
                "rst_DisplayHelpText": ""
        }}
        //fillRule  A string that defines how the inside of a shape is determined.

        ], recdata);

    var edit_buttons = [
        {text:window.hWin.HR('Cancel'), 
            id:'btnRecCancel',
            css:{'float':'right'}, 
            click: function() { 
                edit_dialog.dialog('close'); 
        }},
        {text:window.hWin.HR('Save'),
            id:'btnRecSave',
            css:{'visibility':'hidden', 'float':'right'},  
            click: function() { 
                var res = _editing_symbology.getValues(); //all values
                //remove empty values
                var propNames = Object.getOwnPropertyNames(res);
                for (var i = 0; i < propNames.length; i++) {
                    var propName = propNames[i];
                    if (window.hWin.HEURIST4.util.isempty(res[propName])) {
                        delete res[propName];
                    }
                }
                if(res['iconType']=='circle'){
                    res['radius'] = (res['iconSize']>0?res['iconSize']:8);
                }
                _editing_symbology.setModified(false);
                edit_dialog.dialog('close');
                
                if($.isFunction(callback)){
                    callback.call(this, res);
                }

        }}
    ];                

    //
    //
    edit_dialog = popup_dlg.dialog({
        autoOpen: true,
        height: (mode_edit==2)?300:600,
        width:  740,
        modal:  true,
        title: window.hWin.HR('Define Symbology'),
        resizeStop: function( event, ui ) {//fix bug
            //that.element.css({overflow: 'none !important','width':that.element.parent().width()-24 });
        },
        beforeClose: function(){
            //show warning in case of modification
            if(_editing_symbology.isModified()){
                var $dlg, buttons = {};
                buttons['Save'] = function(){ 
                    //that._saveEditAndClose(null, 'close'); 
                    edit_dialog.parent().find('#btnRecSave').click();
                    $dlg.dialog('close'); 
                }; 
                buttons['Ignore and close'] = function(){ 
                    _editing_symbology.setModified(false);
                    edit_dialog.dialog('close'); 
                    $dlg.dialog('close'); 
                };

                $dlg = window.hWin.HEURIST4.msg.showMsgDlg(
                    'You have made changes to the data. Click "Save" otherwise all changes will be lost.',
                    buttons,
                    {title:'Confirm',yes:'Save',no:'Ignore and close'});
                return false;   
            }
            return true;
        },

        buttons: edit_buttons
    });                

                
}//end editSymbology
