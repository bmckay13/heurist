    var Hul = top.HEURIST.util;

    //show list of selected rectypes    
    function showSelectedRecTypes(){
        
        var $mdiv = $("#selectedRectypes");
        $mdiv.empty();
        var grp = top.HEURIST.rectypes.groups;
        
                var newvalue = "", txt="",
                    ind, dtName, rtID, grpID;
                   
                var $table_div = $("<div>").css({'max-height':'350px','width':'100%','overflow-y':'auto'});    
                var $table =$("<table>").appendTo($table_div);
                
                $("<tr>").css('text-align','left').html("<th>Entity Group</th><th>TabGrp</th><th>Form</th><th>Record type &gt;&gt; record types referenced</th>").appendTo($table);
                
                            
                       for (grpID in grp) {
                            if(!isNaN(grpID)){
                                dtName = top.HEURIST.rectypes.groups[grpID].name;
                                arr =  top.HEURIST.rectypes.groups[grpID].showTypes;
                                if(!Hul.isnull(dtName) && arr.length>0){
                                    
                                    //find dependent recordtypes
                                     var $tr =$("<tr>")
                                        .append($("<td>").css('font-weight','bold').text(dtName));

                                     var i=0, idx;                                     
                                     for (idx in arr) {
                                         rtID = arr[idx];
                                         if(!isNaN(rtID)){
                                         
                                            if(i>0){
                                               $tr =$("<tr>").append($("<td>").text(" "));
                                            }                                                                                //checked='checked'
                                            
                                            if(top.HEURIST.rectypes['typedefs'][rtID]){

                                                    //subdependent
                                                    var deprts2 = findDependentRecordTypes(rtID);
                                            
                                                    $tr.append($("<td>").css('text-align','center').append("<input type='checkbox' id='crt"+rtID+"' name='crt[]' value='"+rtID+"' depended='"+deprts2.join(",")
                                                                        +"' onclick='onRtCheckBox(this);'>"))
                                                      .append($("<td>").css('text-align','center').append("<input type='checkbox' id='frt"+rtID+"' name='frt[]' value='"+rtID+"' onclick='{return false;}'>"));
                                                    
                                                    dtName = "<b>"+top.HEURIST.rectypes.names[rtID]+"</b>"; 
                                            
                                                    var subnames = [];
                                                    for (j=0;j<deprts2.length;j++){
                                                        subnames.push(top.HEURIST.rectypes.names[deprts2[j]]);
                                                    }
                                                    if(subnames.length>0){
                                                       dtName = dtName + " >> " + subnames.join(", ");    
                                                    }
                                            
                                            }else{
                                                $tr.append($("<td>",{'colspan':2}).html('rt#'+rtID));
                                                dtName = " not found";
                                            }
                                            
                                            $tr.append($("<td>").append(dtName));
                                            $tr.appendTo($table);
                                            
                                            i++;
                                         }
                                     }//for rectypes
                                }
                            }
                        } //for

                $mdiv.append($("<p>").css('width','600px').append($("<i>").html('Please select ONLY entity (record) types which you want to be represented as top level tab groups.<br /><br />'+
'Any entity which is referenced by a pointer or relationship marker within these entity types (eg. a site within a project, a context within a site, '+
'an artefact, sample or feature within a context) is indicated by >> and will be included automatically in the appropriate locations. The Form column '+
'shows whether a data entry form will be included in the app.')));
                        
                $mdiv.append($table_div);                
                $mdiv.append($("<p>").append($("<i>").html('Select additional top level tab groups for your app:')));                

                $("<div>").css('font-weight','bold').append("<input type='checkbox' id='ct0'><label for='ct0'>Control tab<label>").appendTo($mdiv);
                $("<div>").css('padding-left','40px').append("<input type='checkbox' checked='checked' id='ct1'><label for='ct1'>Start/stop synching (always on if not checked)<label>").appendTo($mdiv);
                $("<div>").css('padding-left','40px').append("<input type='checkbox' checked='checked' id='ct2'><label for='ct2'>Start Internal GPS (on from start if not checked)<label>").appendTo($mdiv);
                $("<div>").css('padding-left','40px').append("<input type='checkbox' id='ct3'><label for='ct3'>Connect to External GPS (leave unchecked if no external GPS)<label>").appendTo($mdiv);
                $("<div>").css('padding-left','40px').append("<input type='checkbox' checked='checked' id='ct4'><label for='ct4'>Switch tracklog on/off (tracklog unavailable if not checked)<label>").appendTo($mdiv);
                $("<br>").appendTo($mdiv);
                $("<div>").css('font-weight','bold').append("<input type='checkbox' id='mt0'><label for='mt0'>Map tab<label>").appendTo($mdiv);
                $("<div>").css('padding-left','40px').append("<input type='checkbox' id='mt1'><label for='mt1'>Ordnance survey 1:25K [tiled]<label>").appendTo($mdiv);
                $("<div>").css('padding-left','40px').append("<input type='checkbox' id='mt2'><label for='mt2'>Claire's sketch map [tiled]<label>").appendTo($mdiv);
                $("<div>").css('padding-left','40px').append("<input type='checkbox' id='mt3'><label for='mt3'>New road alignment [KML]<label>").appendTo($mdiv);
                        
            //$("#rt_selected").val(recordTypesSelected);
            $("#buttondiv").css('display','block');                        
        
    }

    //returns array of recordtypes dependent on given (constains in resopurces and relmarkers)    
    function findDependentRecordTypes(rtID){
        
        var idx_rst_dt_type  = top.HEURIST.rectypes['typedefs']['dtFieldNamesToIndex']["dty_Type"];
        var idx_rst_pointers = top.HEURIST.rectypes['typedefs']['dtFieldNamesToIndex']["rst_PtrFilteredIDs"];
        var rst_fields = top.HEURIST.rectypes['typedefs'][rtID]['dtFields'];
        var res = [];
        
        for (idx in rst_fields) {
            if(Hul.isNumber(idx)){
                var field = rst_fields[idx];
                var dt_type = field[idx_rst_dt_type];
                if(dt_type=="relmarker" || dt_type=="resource"){
                    var dt_pointers = field[idx_rst_pointers];
                    if(!Hul.isempty(dt_pointers)){
                        var ids = dt_pointers.split(",");
                        res = res.concat(ids);
                    }
                }
            }
        }//for
        
        return res;
    }//end findDependentRecordTypes
      
    /**
    * onSelectRectype - NOT USED ANYMORE
    *
    * listener of "Select Record Type" buttons
    * Shows a popup window where you can select record types
    */
    function onSelectRectype(_db)
    {

            var URL;
            var args = $("#rt_selected").val();
            var URL =  top.HEURIST.basePath + "admin/structure/rectypes/selectRectype.html?type=select&db="+_db;

            if(args) {
                URL =  URL + "&ids=" + args;
            }

            Hul.popupURL(top, URL, {
                "close-on-blur": false,
                "no-resize": true,
                height: 480,
                width: 440,
                callback: showSelectedRecTypes
            });
    }
    
    function onRtCheckBox(args){
        
        var deps = [];
        //find all crt checkboxes
        $('input[id^="crt"]').each(function(ind){
            if($(this).is(":checked")){
                var dep = $(this).attr('depended')
                dep = dep.split(",");
                dep.push( this.id.substring(3) );
                //gather all dependent rectypes
                deps = deps.concat(dep);
            }
        });
        
        //check frt that are in dependent list
        $('input[id^="frt"]').each(function(ind){
              $(this).attr('checked', deps.indexOf( this.id.substring(3) )>=0 );
        });
        
/*        
        var ele = args[0];
        var rtid = ele.id;
        $("#frt"+rtid.substring(3)).attr('checked', ele.checked);
        $.each(args, function( index, value ) {
            if(index>0)
                $("#frt"+value).attr('checked', ele.checked);
        });
*/        
    }
