<?php

    /**
    * Application interface. See hRecordMgr in hapi.js
    * Record search and output in required format
    * 
    * parameters
    * db - heurist database
    * format = json|csv|kml|hml
    * prefs:{ format specific parameters }, }
    * 
    * prefs for csv
                csv_delimiter :','
                csv_enclosure :'""
                csv_mvsep     :'|',
                csv_linebreak :'nix',
                csv_header    :true
    *           fields        : {rtid:[dtid1, dtid3, dtid2]}
    * 
    *
    * @package     Heurist academic knowledge management system
    * @link        http://HeuristNetwork.org
    * @copyright   (C) 2005-2018 University of Sydney
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

    require_once (dirname(__FILE__).'/../System.php');
    require_once (dirname(__FILE__).'/../dbaccess/db_recsearch.php');
    require_once (dirname(__FILE__).'/../dbaccess/utils_db.php');
    require_once (dirname(__FILE__).'/../structure/dbsTerms.php');
    require_once(dirname(__FILE__).'/../../common/php/Temporal.php');
    require_once(dirname(__FILE__).'/../../admin/verification/verifyValue.php');

    $response = array();

    $system = new System();
    
    if(@$_REQUEST['postdata']){
        $params = json_decode($_REQUEST['postdata'], true);
    }else{
        $params = $_REQUEST;
    }
    
    
    if( ! $system->init(@$params['db']) ){
        //get error and response
        $response = $system->getError();
        print 'Error';
        exit();
    }
    
    if(!@$params['format']) $params['format'] = 'json';
    
    $search_params = array();
    $search_params['w'] = @$params['w'];
    $search_params['rules'] = @$params['rules'];
    $search_params['needall'] = 1;  //search without limit of returned record count
    
    if(@$params['ids']){
        $search_params['q'] = array('ids'=>implode(',',$params['ids']));
    }else{
        $search_params['q'] = $params['q'];
    }

    $is_csv = (@$params['format'] == 'csv');
    if(@$params['format']){
        /*forcefully sort by record type    
        if(is_array(@$params['q'])){
            $query_json = $params['q'];
        }else{
            $query_json = json_decode(@$params['q'], true);
        }

        if(is_array($query_json) && count($query_json)>0){
            $params['q'] = $query_json;
            if($is_csv) $params['q']['sortby']='rt';
        }else if($is_csv) {
             $params['q'] = @$params['q'].' sortby:rt';
        }
        */
        
        //search only ids - all 
        $search_params['detail'] = 'ids';
    }

/* DEBUG    
    if(is_array($search_params['q'])){
        error_log(json_encode($search_params['q']));    
    }else{
        error_log($search_params['q']);    
    }
*/
    $response = recordSearch($system, $search_params);

    if($is_csv){
        outputXML($system, $response, $params);
    }else{
        // By default json
        // Return the response object as JSON
        header('Content-type: application/json;charset=UTF-8');
        print json_encode($response);
    }
exit();

/*
$data    array('status'=>HEURIST_OK,
                                'data'=> array(
                                'queryid'=>@$params['id'],  //query unqiue id
                                'entityName'=>'Records',
                                'count'=>$total_count_rows,
                                'offset'=>get_offset($params),
                                'reccount'=>count($records),
                                'records'=>$records));
                                
if parameter prefs.fields is defined it creates separate file for every record type
                               
fields {rtid:{id, url, title, dt1, dt2, ....  dt4:resource_rt1, dt4:resource_rt2  } }                               
                               
for constrained resourse fields we use "dt#:rt#"                                
@todo for enum fields use dt#:code,dt#:id,dt#:label
                               
NOTE: fastest way it simple concatenation in comparison to fputcsv and implode. We use fputcsv
*/
function outputXML($system, $data, $params){
    
    if (!($data && @$data['status']==HEURIST_OK)){
        print print_r($data, true); //print out error array
        return;
    }

    $data = $data['data'];
    
    if(!(@$data['reccount']>0)){
        print 'EMPTY RESULT SET'; //'empty result set';
        return;
    }
    
    $include_term_label_and_code = true;
    $include_term_code = (@$params['prefs']['include_term_label_and_code']==1);
    $include_resource_titles =  (@$params['prefs']['include_resource_titles']==1);
    $include_term_hierarchy = (@$params['prefs']['include_term_hierarchy']==1);
    
    $fields = @$params['prefs']['fields'];
    $details = array();  //array of detail fields included into output
    $relmarker_details = array(); //relmarker fields included into output
    
    $rtStructs = dbs_GetRectypeStructures($system, null, 2);
    $idx_name = $rtStructs['typedefs']['dtFieldNamesToIndex']['rst_DisplayName'];
    $idx_dtype = $rtStructs['typedefs']['dtFieldNamesToIndex']['dty_Type'];
    $idx_term_tree = $rtStructs['typedefs']['dtFieldNamesToIndex']['rst_FilteredJsonTermIDTree'];
    $idx_term_nosel = $rtStructs['typedefs']['dtFieldNamesToIndex']['dty_TermIDTreeNonSelectableIDs'];
    

    if($include_term_label_and_code){
        $rtTerms = dbs_GetTerms($system);
        /*
        $idx_term_label = $rtTerms['fieldNamesToIndex']['trm_Label'];
        $idx_term_code = $rtTerms['fieldNamesToIndex']['trm_Code'];
        $rtTerms = $rtTerms['termsByDomainLookup']['enum'];
        */
        $rtTerms = new DbsTerms($system, $rtTerms);
    }
    
    //create header
    $any_rectype = null;
    $headers = array();
    if($fields){
        foreach($fields as $rt=>$flds){
            
            //always include ID field into output
            if($flds[0]!='rec_ID') array_unshift($flds, 'rec_ID');
            $fields[$rt] = $flds;
            
            $details[$rt] = array();
            $headers[$rt] = array();
            $relmarker_details[$rt] = array();
            
            foreach($flds as $dt_id){
                
                $constr_rt_id = 0;
                if(strpos($dt_id,':')>0){ //for constrained resource fields
                    //example author:person or organization
                    list($dt_id, $constr_rt_id) = explode(':',$dt_id);
                }
                
                if(is_numeric($dt_id) && $dt_id>0){
                    
                    //get field name from structure
                    $field_name = $rtStructs['typedefs'][$rt]['dtFields'][$dt_id][$idx_name];
                    $field_type = $rtStructs['typedefs'][$rt]['dtFields'][$dt_id][$idx_dtype];
                    if($constr_rt_id>0){
                        $rectypename_is_in_fieldname = (strpos(strtolower($field_name), 
                                            strtolower($rtStructs['names'][$constr_rt_id]))!==false);
                        $field_name_title = $field_name.'('.
                                                ($rectypename_is_in_fieldname?'':($rtStructs['names'][$constr_rt_id].' '))
                                                .'Title)';
                        $field_name = $field_name.($rectypename_is_in_fieldname
                                            ?'':' ('.$rtStructs['names'][$constr_rt_id].')').' H-ID';
                    }
                    if($field_type=='relmarker'){
                        $relmarker_details[$rt][$dt_id] = $constr_rt_id; 
                    }else{
                        array_push($details[$rt], $dt_id);    
                    }
                    
                }else{
                    $field_type = null;
                    
                    if($dt_id=='rec_ID'){
                        if($rt>0){
                            $field_name = $rtStructs['names'][$rt].' H-ID';
                        }else{
                            $field_name = 'H-ID';
                            $any_rectype = $rt;
                        }
                    }else{
                        $field_name = $dt_id; //record header field
                    }
                }
    
                array_push($headers[$rt], $field_name);            
                if($include_term_label_and_code && $field_type=='enum'){
                    array_push($headers[$rt], $field_name.' (Label)');            
                    if($include_term_code) array_push($headers[$rt], $field_name.' (Code)' );   
                             
                }else if($include_resource_titles && ($field_type=='resource' || $field_type=='relmarker')){
                    array_push($headers[$rt], $field_name_title);            
                }
            }
        }
    }
    
    $csv_delimiter =  $params['prefs']['csv_delimiter']?$params['prefs']['csv_delimiter']:',';
    $csv_enclosure =  $params['prefs']['csv_enclosure']?$params['prefs']['csv_enclosure']:'"';
    $csv_mvsep =  $params['prefs']['csv_mvsep']?$params['prefs']['csv_mvsep']:'|';
    $csv_linebreak =  $params['prefs']['csv_linebreak']?$params['prefs']['csv_linebreak']:'nix'; //not used
    $csv_header =  $params['prefs']['csv_header']?$params['prefs']['csv_header']:true;
    
    
    //------------
    
    $records = $data['records'];
    $records_out = array(); //ids already out
    $streams = array(); //one per record type
    $rt_counts = array();
    
    $error_log = array();
    $error_log[] = 'Total rec count '.count($records);
    
    $idx = 0;
    while ($idx<count($records)){ //replace to WHILE
    
        $recID = $records[$idx];
        $idx++;
        $record = recordSearchByID($system, $recID, false);
        
        $rty_ID = ($any_rectype!=null)?$any_rectype :$record['rec_RecTypeID'];
        
        if(!@$fields[$rty_ID]) continue; //none of fields for this record type marked to output
        
        if(!@$streams[$rty_ID]){
            // create a temporary file
            $fd = fopen('php://temp/maxmemory:1048576', 'w');  //less than 1MB in memory otherwise as temp file 
            if (false === $fd) {
                die('Failed to create temporary file');
            }        
            $streams[$rty_ID] = $fd;
            
            //write header
            if($csv_header)
                fputcsv($fd, $headers[$rty_ID], $csv_delimiter, $csv_enclosure);
            
            
            $rt_counts[$rty_ID] = 1;
        }else{
            $fd = $streams[$rty_ID];
            
            $rt_counts[$rty_ID]++;
        }
        
        if(count(@$details[$rty_ID])>0){
            //fills $record
            recordSearchDetails($system, $record, $details[$rty_ID]);
        }
        if(count(@$relmarker_details[$rty_ID])>0){
            $related_recs = recordSearchRelated($system, array($recID), 0);
            if(@$related_recs['status']==HEURIST_OK){
                $related_recs = $related_recs['data'];
            }else{
                $related_recs = array();    
            }
        }else{
            $related_recs = array();
        }
        
        //prepare output array
        $record_row = array();
        foreach($fields[$rty_ID] as $dt_id){
            
            //suppl.fields for enum and resource fields
            $enum_label = array();
            $enum_code = array();
            $resource_titles = array();
            
            $constr_rt_id = 0;
            if(strpos($dt_id,':')>0){ //for constrained resource fields
                list($dt_id, $constr_rt_id) = explode(':', $dt_id);
            }
            
            if(is_numeric($dt_id) && $dt_id>0){
                
                if ($constr_rt_id>0 && @$relmarker_details[$rty_ID][$dt_id]==$constr_rt_id) {  //relation
                
                    $vals = array();
                    
                    //if(window.hWin.HEURIST4.ui.isTermInList(this.detailType, allTerms, headerTerms, direct[k]['trmID']))
                
                    foreach($related_recs['direct'] as $relation){
                        $target_rt = $related_recs['headers'][$relation->targetID][1];
                        if( $constr_rt_id==$target_rt && $relation->trmID>0){ //contrained rt and allowed relation type
                            
                            $all_terms = $rtStructs['typedefs'][$rty_ID]['dtFields'][$dt_id][$idx_term_tree];
                            $nonsel_terms = $rtStructs['typedefs'][$rty_ID]['dtFields'][$dt_id][$idx_term_nosel];
                            $is_allowed = VerifyValue::isValidTerm($all_terms, $nonsel_terms, $relation->trmID, $dt_id);    
                            
                            if($is_allowed){
                                //if record type among selected -  add record to list to be exported
                                //otherwise export only ID  as field "Rectype H-ID"
                                if($fields[$target_rt]){ //record type exists in output
                                    if(!in_array($relation->targetID, $records)){
                                             array_push($records, $relation->targetID);  //add to be exported  
                                    }
                                }
                                $vals[] = $relation->targetID;
                                
                                if($include_resource_titles){
                                     $resource_titles[] = $related_recs['headers'][$relation->targetID][0];
                                }
                            }
                        }
                    }//foreach
                    
                    //reverse will work only in case source record has detail id as in target
                    foreach($related_recs['reverse'] as $relation){
                        $source_rt = $related_recs['headers'][$relation->sourceID][1];
                        if( $constr_rt_id==$source_rt && $relation->trmID>0
                            && @$rtStructs['typedefs'][$source_rt]['dtFields'][$dt_id]
                           ){ //contrained rt and allowed relation type
                            
                            $all_terms = $rtStructs['typedefs'][$source_rt]['dtFields'][$dt_id][$idx_term_tree];
                            $nonsel_terms = $rtStructs['typedefs'][$source_rt]['dtFields'][$dt_id][$idx_term_nosel];
                            $is_allowed = VerifyValue::isValidTerm($all_terms, $nonsel_terms, $relation->trmID, $dt_id);    
                            
                            if($is_allowed){
                                //if record type among selected -  add record to list to be exported
                                //otherwise export only ID  as field "Rectype H-ID"
                                if($fields[$source_rt]){ //record type exists in output
                                    if(!in_array($relation->sourceID, $records)){
                                             array_push($records, $relation->sourceID);  //add to be exported  
                                    }
                                }
                                $vals[] = $relation->sourceID;
                                
                                if($include_resource_titles){
                                     $resource_titles[] = $related_recs['headers'][$relation->sourceID][0];
                                }
                            }
                        }
                    }                    
                
                    $value = implode($csv_mvsep, $vals);
                    
                    if($include_resource_titles && count($vals)<1){ //empty value
                        $resource_titles[] = '';
                    }
                    
                }else{
                
                    $dt_type = $rtStructs['typedefs'][$rty_ID]['dtFields'][$dt_id][$idx_dtype];
                        
                    $values = @$record['details'][$dt_id];
                    
                    if($values){
                        
                        //$values = array_values($values); //get plain array
                        $vals = array();
                        
                        if($dt_type=="resource"){
                            
                                //if record type among selected -  add record to list to be exported
                                //otherwise export only ID (and optionally title)  as field "Rectype H-ID"
                                foreach($values as $val){
                                    if( (!($constr_rt_id>0)) || $constr_rt_id==$val['type'] ){ //unconstrained or exact required rt
                                        
                                        if($fields[$val['type']]){ //record type exists in output
                                            if(!in_array($val['id'], $records)){
                                                     array_push($records, $val['id']);  //add to be exported  
                                            }
                                        }
                                        $vals[] = $val['id'];
                                        
                                        if($include_resource_titles){
                                             $resource_titles[] = $val['title'];
                                        }
                                    }
                                }
                        }else if($dt_type=='geo'){
                                foreach($values as $val){
                                     $vals[] = $val['geo']['wkt'];
                                }
                        }else if($dt_type=='file'){
                                foreach($values as $val){
                                     $vals[] = $val['file']['ulf_ObfuscatedFileID'];
                                }                        
                        }else if($dt_type=='date'){
                                foreach($values as $val){
                                     $vals[] = temporalToHumanReadableString(trim($val));
                                }                        
                        }else if($include_term_label_and_code && $dt_type=='enum'){
                            
                                if(count($values)>0){
                                    foreach($values as $val){
                                        $enum_label[] = $rtTerms->getTermLabel($val, $include_term_hierarchy);
                                        // @$rtTerms[$val][$idx_term_label]?$rtTerms[$val][$idx_term_label]:'';
                                        $enum_code[] = $rtTerms->getTermCode($val);
                                        //@$rtTerms[$val][$idx_term_code]?$rtTerms[$val][$idx_term_code]:'';
                                    }                        
                                }else{
                                    $enum_label[] = '';
                                    $enum_code[] = ''; 
                                }
                                $vals = $values;
                        }else{
                            $vals = $values;
                        }
                        
                        $value = implode($csv_mvsep, $vals);
                    }else{
                        $value = null;
                    }
                    
                    //empty values
                    if($value == null){
                        if($include_term_label_and_code && $dt_type=='enum'){
                            $enum_label[] = '';
                            $enum_code[] = ''; 
                        }else if($include_resource_titles && $dt_type=='resource'){
                            $resource_titles[] = '';
                        }
                    }
                    
                }
                
            }else if ($dt_id=='rec_Tags'){
                
                $value = recordSearchPersonalTags($system, $recID);
                $value = ($value==null)?'':implode($csv_mvsep, $value);
                
            }else{
                $value = @$record[$dt_id]; //from record header
            }
            if($value==null) $value = '';                       
            
            $record_row[] = $value;
            
            if(count($enum_label)>0){
                $record_row[] = implode($csv_mvsep,$enum_label);    
                if($include_term_code) $record_row[] = implode($csv_mvsep,$enum_code);    
            }else if (count($resource_titles)>0){
                $record_row[] = implode($csv_mvsep,$resource_titles);    
            }
            
        }//for fields
        
        // write the data to csv
        fputcsv($fd, $record_row, $csv_delimiter, $csv_enclosure);
        
    }//for records
    
    //calculate number of streams with columns more than one
    $count_streams = 0;
    foreach($headers as $rty_ID => $columns){
        if(count($columns)>1){
            $count_streams++;        
        }
    }
    
    $error_log[] = print_r($rt_counts, true);
        
    if($count_streams<2){
        
        $out = false;
        $rty_ID = 0;
        
        if(count($streams)==0){
            array_push($error_log, "Streams are not defined");
        }else{
            $rty_ID = array_keys($streams);
            $rty_ID = $rty_ID[0];
        
            $filename = 'Export_'.$system->dbname();
            if($rty_ID>0){
                        $filename = $filename.'_'.$rtStructs['names'][$rty_ID];
            }
            $filename = $filename.'_'.date("YmdHis").'.csv';
        
            $fd = $streams[$rty_ID];

            if($fd==null){
                array_push($error_log, "Stream for record type $rty_ID is not defined");
            }else{
                rewind($fd);
                $out = stream_get_contents($fd);
                fclose($fd);
            }
        }

        if($out===false || strlen($out)==0){
            array_push($error_log, "Stream for record type $rty_ID is empty");
            $out = implode(PHP_EOL, $error_log);
        }
        
        header('Content-Type: text/csv');
        header('Content-disposition: attachment; filename='.$filename);
        header('Content-Length: ' . strlen($out));
        exit($out);
        
    }else{
    
        $zipname = 'Export_'.$system->dbname().'_'.date("YmdHis").'.zip';
        $destination = tempnam("tmp", "zip");
        
        $zip = new ZipArchive();
        if (!$zip->open($destination, ZIPARCHIVE::OVERWRITE)) {
            array_push($error_log, "Cannot create zip $destination");    
        }else{
            $is_first = true;
        
            foreach($streams as $rty_ID => $fd){
                
                if($fd==null){
                    array_push($error_log, "Stream for record type $rty_ID is not defined");
                }else{
                    // return to the start of the stream
                    rewind($fd);
                    
                    if($is_first || count($headers[$rty_ID])>1){
                        $is_first = false;
                    
                        $content = stream_get_contents($fd);

                        if($content===false || strlen($content)==0){
                            array_push($error_log, "Stream for record type $rty_ID is empty");
                        }else{
                            // add the in-memory file to the archive, giving a name
                            $zip->addFromString('rectype-'.$rty_ID.'.csv',  $content);
                        }
                        
                    }
                    //close the file
                    fclose($fd);
                }
            }    
            
            if(count($error_log)>0){
                $zip->addFromString('log.txt', implode(PHP_EOL, $error_log) );
            }
            
            // close the archive
            $zip->close();
        }
        
        if(@file_exists($destination)>0){
        
            header('Content-Type: application/zip');
            header('Content-disposition: attachment; filename='.$zipname);
            header('Content-Length: ' . filesize($destination));
            readfile($destination);

            // remove the zip archive
            unlink($destination);    
        
        }else{
            array_push($error_log, "Zip archive ".$destination." doesn't exist");
            
            $out = implode(PHP_EOL, $error_log);
            header('Content-Type: text/csv');
            header('Content-disposition: attachment; filename=log.txt');
            header('Content-Length: ' . strlen($out));
            exit($out);
            
        }
        
    }
    
//DEBUG error_log(print_r($error_log,true));


}

    
?>