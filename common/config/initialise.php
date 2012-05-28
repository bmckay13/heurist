<?php

	/*<!--
	* filename, brief description, date of creation, by whom
	* @copyright (C) 2005-2010 University of Sydney Digital Innovation Unit.
	* @link: http://HeuristScholar.org
	* @license http://www.gnu.org/licenses/gpl-3.0.txt
	* @package Heurist academic knowledge management system
	* @todo
	-->*/

	require_once(dirname(__FILE__).'/../../configIni.php');  // read in the configuration file

	/*
	the standard initialisation file configIni.php is in the root directory of the Heurist
	distribution and contains (mostly) blank definitions. This file should be edited to set the configuration
	of your installation. Heurist will also look for the file one level up and override the values in
	configIni.php (this allows the initialisation file to be included in the source code, while
	a developer can specify passwords etc. without including them in the source code they distribute).

	configIni.php sets the following:
	$dbHost - - host for the MySQL server
	$dbAdminUsername, $dbAdminPassword - read/write user and password
	$dbReadonlyUsername, $dbReadonlyPassword - read-only user name and password
	$dbPrefix - prepended to all database names
	$defaultDBname - database to use if no ?db= specified
	$defaultRootFileUploadPath - root location for uploaded files/record type icons/templates etc.
	$sysAdminEmail - email address of system adminstrator
	$infoEmail - redirect info@ emails to this address
	*/

	//set up system path defines

	define('HEURIST_VERSION',"3.1.0");// need to change this in common/js/utilLoad.js
	define('HEURIST_MIN_DBVERSION',"1.0.0");

	define('HEURIST_TOP_DIRS',"admin|common|export|external|hapi|help|import|records|search|viewers");
	// a pipe delimited list of the top level directories in the heurist code base root. Only change if new ones are added.
	define('HEURIST_SERVER_NAME', @$_SERVER["SERVER_NAME"]);	// server host name for the configured name, eg. heuristscholar.org
	define('HEURIST_HOST_NAME', @$_SERVER["HTTP_HOST"]);	    // eg. heuristscholar.org
	define('HEURIST_DOCUMENT_ROOT',@$_SERVER["DOCUMENT_ROOT"]); //  eg. /var/www/htdocs

	// calculate the dir where the Heurist code is installed, for example /h3 or /h3-ij
	$installDir = preg_replace("/\/(".HEURIST_TOP_DIRS.")\/.*/","",@$_SERVER["SCRIPT_NAME"]);// remove "/top level dir" and everything that follows it.

	if($installDir == @$_SERVER["SCRIPT_NAME"]) {	// no top directories in this URI must be a root level script file or blank
		$installDir = preg_replace("/\/index.php/","",@$_SERVER["SCRIPT_NAME"]);// strip away the "/index.php" if it's there
		}
	if($installDir != @$_SERVER["SCRIPT_NAME"]) {	// this should be the path difference between document root and heurist code root
		define('INSTALL_DIR', $installDir);	//the subdir of the server's document directory where heurist is installed
	}else{
		define('INSTALL_DIR', '');	//the default is the document root directory
	}


	define('HEURIST_SITE_PATH',INSTALL_DIR == ''? '/' : INSTALL_DIR.'/'); // eg. /h3-ij/
	define('HEURIST_BASE_URL','http://'.HEURIST_HOST_NAME.HEURIST_SITE_PATH); // eg. http://heuristscholar.org/h3-ij/

	//set up database server connection defines
	if ($dbHost) {
		define('HEURIST_DBSERVER_NAME', $dbHost);
	} else {
		define('HEURIST_DBSERVER_NAME', "localhost"); //configure to access mysql on the same machine as the Heruist codebase
		}

	if (!($dbAdminUsername && $dbAdminPassword && $dbReadonlyUsername && $dbReadonlyPassword)){ //if these are not specified then we can't do anything
		returnErrorMsgPage(1,"MySql user account/password not specified. Set in configIni.php");
	}

	define('ADMIN_DBUSERNAME',$dbAdminUsername);	//user with all rights so we can create databases, etc.
	define('ADMIN_DBUSERPSWD',$dbAdminPassword);
	define('READONLY_DBUSERNAME',$dbReadonlyUsername);	//readonly user for access to user and heurist databases
	define('READONLY_DBUSERPSWD',$dbReadonlyPassword);

	define('HEURIST_DB_PREFIX', (@$_REQUEST['prefix']? $_REQUEST['prefix'] : $dbPrefix)); //database name prefix which is added to db=name to compose the mysql dbname used in queries, normally hdb_
	define('HEURIST_SYSTEM_DB', $dbPrefix."HeuristSystem");	// database which contains Heurist System level data - deprecated
	define('HEURIST_REFERENCE_BASE_URL', "http://heuristscholar.org/h3/");	// Heurist Installation which contains reference structure definitions (registered DB # 3)
	define('HEURIST_INDEX_BASE_URL', "http://heuristscholar.org/h3/");	// Heurist Installation which contains index of registered Heurist databases (registered DB # 1)
	define('HEURIST_SYS_GROUP_ID', 1);	// ID of Heurist System User Group which has special privileges - deprecated, although more generally group 1 on every database is the database owners group
	//error_log("in initialise dbHost = $dbHost");
	//test db connect valid db
	$db = mysql_connect(HEURIST_DBSERVER_NAME, $dbAdminUsername, $dbAdminPassword) or
	returnErrorMsgPage('1',"Unable to connect to db server with admin account, set login in configIni.php. MySQL error: ".mysql_error());
	$db = mysql_connect(HEURIST_DBSERVER_NAME, $dbReadonlyUsername, $dbReadonlyPassword) or
	returnErrorMsgPage('1',"Unable to connect to db server with readonly account, set login in configIni.php. MySQL error: ".mysql_error());

	if (@$defaultDBname != '') {
		define('HEURIST_DEFAULT_DBNAME',$defaultDBname);	//default dbname used when the URI is ambiguous about the db
		}

	if (@$httpProxy != '') {
		define('HEURIST_HTTP_PROXY',$httpProxy);	//http address:port for proxy request
	}

	// error_log("initialise REQUEST = ".print_r($_REQUEST,true));

	if (@$_REQUEST["db"]) {
		$dbName = $_REQUEST["db"];
	}else if (@$_REQUEST["instance"]) { // saw TODO: temporary until change instance to db
		$dbName = $_REQUEST["instance"];
		// let's try the refer in case we are being called from an HTML page.
		}else if (@$_SERVER["HTTP_REFERER"] && preg_match("/.*db=([^&]*).*/",$_SERVER["HTTP_REFERER"],$refer_db)) {
		$dbName = $refer_db[1];
		// saw TODO: temporary until change instance to db
		}else if (@$_SERVER["HTTP_REFERER"] && preg_match("/.*instance=([^&]*).*/",$_SERVER["HTTP_REFERER"],$refer_instance)) {
		$dbName = $refer_instance[1];
	}
	if (!@$dbName) {
		if (@$_SESSION["heurist_last_used_dbname"]) {
			$dbName = $_SESSION["heurist_last_used_dbname"];
		}else if (defined("HEURIST_DEFAULT_DBNAME")) {
			$dbName = HEURIST_DEFAULT_DBNAME;
		} else {
			returnErrorMsgPage('1',"Ambiguous database name, or no database name supplied. Please supply as '?db=' parameter or ask sysadmin to set in configIni.php");
		}
	}
	define('HEURIST_DBNAME', $dbName);
	$dbFullName = HEURIST_DB_PREFIX.HEURIST_DBNAME;
	if ($dbFullName == "") {
		returnErrorMsgPage('0',"Invalid database - both prefix and database name are blank");
	}
	define('HEURIST_SESSION_DB_PREFIX', $dbFullName.".");
	// we have a database name so test it out
	if (mysql_query("use $dbFullName")) {
		define('DATABASE', $dbFullName);
	} else {
		returnErrorMsgPage('0',"Unable to open database : <b>$dbName</b>, MySQL error: ".mysql_error());
	}

	// using the database so let's get the configuration data from it's sys table
	$res = mysql_query('select * from sysIdentification');
	if (!$res) returnErrorMsgPage('0',"Unable to read sysIdentification information, MySQL error: ".mysql_error());
	$sysValues = mysql_fetch_assoc($res);

	// set up user access and group table stuff
	$udb = $sysValues['sys_UGrpsDatabase'];
	if ($udb) {
		define('USERS_DATABASE', $udb);
	}else{
		define('USERS_DATABASE',DATABASE); //use the system db for UGrp information
		}

	// access control logic defines
	define('USERS_TABLE', 'sysUGrps');
	define('USERS_ID_FIELD', 'ugr_ID');
	define('USERS_USERNAME_FIELD', 'ugr_Name');
	define('USERS_PASSWORD_FIELD', 'ugr_Password');
	define('USERS_FIRSTNAME_FIELD', 'ugr_FirstName');
	define('USERS_LASTNAME_FIELD', 'ugr_LastName');
	define('USERS_ACTIVE_FIELD', 'ugr_Enabled');
	define('USERS_EMAIL_FIELD', 'ugr_eMail');
	define('GROUPS_TABLE', 'sysUGrps');
	define('GROUPS_ID_FIELD', 'ugr_ID');
	define('GROUPS_NAME_FIELD', 'ugr_Name');
	define('GROUPS_TYPE_FIELD', 'ugr_Type');
	define('USER_GROUPS_TABLE', 'sysUsrGrpLinks');
	define('USER_GROUPS_USER_ID_FIELD', 'ugl_UserID');
	define('USER_GROUPS_GROUP_ID_FIELD', 'ugl_GroupID');
	define('USER_GROUPS_ROLE_FIELD', 'ugl_Role');

	// upload path eg. /var/www/htdoCs/HEURIST_FILESTORE
	if ($defaultRootFileUploadPath) {
		define('HEURIST_UPLOAD_ROOT', $defaultRootFileUploadPath);
	} else {
		define('HEURIST_UPLOAD_ROOT', HEURIST_DOCUMENT_ROOT."/HEURIST_FILESTORE/"); // uploaded-heurist-files to 14 Nov 2011
	}

	$upload = @$sysValues['sys_UploadDirectory'];

	if ($upload) {
		if (preg_match("/\/$/",$upload)) {
			$upload = preg_replace("/\/$/","",$upload);
		}

		define('HEURIST_UPLOAD_DIR', $upload); // upload must be a full path
		} else {
		define('HEURIST_UPLOAD_DIR', HEURIST_UPLOAD_ROOT.$dbName.'/');
	}

	// icon path - note code now assumes that this is within the filestore for the database
	define('HEURIST_ICON_DIRNAME',"rectype-icons/");
	define('HEURIST_ICON_ROOT',HEURIST_UPLOAD_DIR); // eg /var/www/htdocs/HEURIST_FILESTORE
	// to 14/11/11: HEURIST_DOCUMENT_ROOT.HEURIST_SITE_PATH."common/images/ so /var/www/htdocs/h3/common/images
	define('HEURIST_ICON_DIR', HEURIST_ICON_ROOT.HEURIST_ICON_DIRNAME);

	if (@$siteRelativeIconUploadBasePath) {
		define('HEURIST_ICON_URL_BASE', $siteRelativeIconUploadBasePath);
	} else {
		define('HEURIST_ICON_URL_BASE', "/HEURIST_FILESTORE/".$dbName."/".HEURIST_ICON_DIRNAME); // uploaded-heurist-files to 14 Nov 2011
	}

	define('HEURIST_THUNB_URL_BASE', 'http://'.HEURIST_HOST_NAME."/HEURIST_FILESTORE/".$dbName."/filethumbs/");
	define('HEURIST_THUMB_DIR', HEURIST_UPLOAD_DIR."filethumbs/");

	//temporary - to remove
		if(!file_exists(HEURIST_THUMB_DIR)){
			if (!mkdir(HEURIST_THUMB_DIR, 0777, true)) {
    			error_log('Failed to create folder for thumbnails');
			}
		}
	//end temporary - to remove




	// smarty template path  - note code now assumes that this is within the fielstore for the database
	define('HEURIST_SMARTY_TEMPLATES_DIRNAME',"smarty-templates/");
	define('HEURIST_SMARTY_TEMPLATES_ROOT',HEURIST_UPLOAD_DIR);
	// to 14/11/11: stored in codebase in viewers/smarty/templates
	define('HEURIST_SMARTY_TEMPLATES_DIR', HEURIST_SMARTY_TEMPLATES_ROOT.HEURIST_SMARTY_TEMPLATES_DIRNAME);

	// xsl templates path  - note code now assumes that this is within the fielstore for the database
	define('HEURIST_XSL_TEMPLATES_DIRNAME',"xsl-templates/");
	define('HEURIST_XSL_TEMPLATES_ROOT',HEURIST_UPLOAD_DIR);
	// to 14/11/11: stroed in codebase under viewers/publish/xsl
	define('HEURIST_XSL_TEMPLATES_DIR', HEURIST_XSL_TEMPLATES_ROOT.HEURIST_XSL_TEMPLATES_DIRNAME);

	//define cocoon record explorer URL
	if (file_exists(HEURIST_DOCUMENT_ROOT.HEURIST_SITE_PATH."/viewers/relbrowser/".HEURIST_DBNAME)) {
		$browserSubDir = HEURIST_DBNAME;
	}else{
		$browserSubDir = "main";
	}

	define('EXPLORE_URL',"/cocoon".HEURIST_SITE_PATH."viewers/relbrowser/".$browserSubDir."/item/");
	// change  define('HEURIST_INSTANCE' to HEURIST_DBNAME
	define('HEURIST_INSTANCE',HEURIST_DBNAME);
	// change  define('HEURIST_INSTANCE_PREFIX' to HEURIST_SESSION_DB_PREFIX
	define('HEURIST_INSTANCE_PREFIX',HEURIST_SESSION_DB_PREFIX);
	// change HOST  HOST_BASE  to  HEURIST_HOST_NAME
	define('HOST',HEURIST_HOST_NAME);
	define('HOST_BASE',HEURIST_HOST_NAME);
	// change HEURIST_URL_BASE to HEURIST_BASE_URL
	define('HEURIST_URL_BASE',HEURIST_BASE_URL);
	$heuristURLBase=HEURIST_URL_BASE;

	if ($sysValues['sys_OwnerGroupID']){
		define ('HEURIST_OWNER_GROUP_ID', $sysValues['sys_OwnerGroupID']);
	}else{
		define ('HEURIST_OWNER_GROUP_ID', 1);
	}

	if ( @$sysValues['sys_RestrictAccessToOwnerGroup'] > 0) {
		define('HEURIST_RESTRICT_GROUP_ID',$sysValues['sys_OwnerGroupID']);
	}

	if (@$sysValues['sys_SetPublicToPendingOnEdit'] == 1) {
		define('HEURIST_PUBLIC_TO_PENDING',1);
	}else{
		define('HEURIST_PUBLIC_TO_PENDING',0);
	}

	define ('HEURIST_NEWREC_OWNER_ID', $sysValues['sys_NewRecOwnerGrpID']);
	define ('HEURIST_NEWREC_ACCESS', $sysValues['sys_NewRecAccess']);
	define ('HEURIST_DBID', $sysValues['sys_dbRegisteredID']);
	define ('HEURIST_DBVERSION', "".$sysValues['sys_dbVersion'].".".$sysValues['sys_dbSubVersion'].".".$sysValues['sys_dbSubSubVersion']);
	if ( HEURIST_MIN_DBVERSION > HEURIST_DBVERSION ) {
		returnErrorMsgPage('0',"Heurist Code Version ".HEURIST_VERSION." requires database schema version # ".HEURIST_MIN_DBVERSION." or higher. ".
		HEURIST_DBNAME." has version # ". HEURIST_DBVERSION." - please update the schema of the database.");
	}

	define ('HEURIST_HML_PUBPATH', $sysValues['sys_hmlOutputDirectory']);
	define ('HEURIST_HTML_PUBPATH', $sysValues['sys_htmlOutputDirectory']);


	// set up email defines
	if ($bugEmail) {
		define('HEURIST_MAIL_TO_BUG', $bugEmail);	//mailto string for heurist installation issues
	}else{
		define('HEURIST_MAIL_TO_BUG', 'prime.heurist@gmail.com');	//mailto string for heurist installation issues
	}

	if ($infoEmail) {
		define('HEURIST_MAIL_TO_INFO', $infoEmail);	//mailto string for heurist installation issues
	}

	if ($sysAdminEmail) {
		define('HEURIST_MAIL_TO_ADMIN', $sysAdminEmail);	//mailto string for heurist installation issues
	}else if ($infoEmail){
		define('HEURIST_MAIL_TO_ADMIN', $infoEmail);	//mailto string for heurist installation issues
	}

	// url of 3d party service that generates thumbnails for given website, set for installation in intialise.php
	define('WEBSITE_THUMBNAIL_SERVICE',$websiteThumbnailService);
	define('WEBSITE_THUMBNAIL_USERNAME',$websiteThumbnailUsername);
	define('WEBSITE_THUMBNAIL_PASSWORD',$websiteThumbnailPassword);
	define('WEBSITE_THUMBNAIL_XSIZE',$websiteThumbnailXsize);
	define('WEBSITE_THUMBNAIL_YSIZE',$websiteThumbnailYsize);

	// MAGIC CONSTANTS for limited set of common rectypes and their detail types
	// they refer to global definition DB and IDs of rectypes/detailtypes there
	define('RT_BUG_REPORT',"2-216");
	define('DT_BUG_REPORT_NAME',"2-179");
	define('DT_BUG_REPORT_FILE',"2-221");
	define('DT_BUG_REPORT_DESCRIPTION',"2-303");
	define('DT_BUG_REPORT_ABSTRACT',"2-560");
	define('DT_BUG_REPORT_STATUS',"2-725");

	define('DT_ALL_ASSOC_FILE','2-221');

	$rtDefines = array(
	'RT_INTERNET_BOOKMARK' => array(2,2),//TODO : change RT_WEB_PAGE with new update.
	'RT_NOTE' => array(2,3),
	'RT_JOURNAL_ARTICLE' => array(3,15),
	'RT_BOOK' => array(3,13),
	'RT_JOURNAL_VOLUME' => array(3,18),
	'RT_RELATION' => array(2,1),
	'RT_PERSON' => array(2,20),//TODO : change 2-10 with new update.
	'RT_MEDIA_RECORD' => array(2,5),
	'RT_IMAGE_LAYER' => array(3,6),//TODO : change 2-11 with new update.
	'RT_KML_LAYER' => array(3,24),
	'RT_AUTHOR_EDITOR' => array(3,23),
	'RT_BLOG_ENTRY' => array(2,8),//TODO : change 2-7 with new update.
	'RT_INTERPRETATION' => array(2,10),//TODO : change 2-8 with new update.
	'RT_FACTOID' => array(3,22),
	'RT_ANNOTATION' => array(3,25),//TODO : change 2-8 with new update.
	'RT_COLLECTION' => array(2,6),
	'RT_FILTER' => array(2,12),
	'RT_TRANSFORMATION' => array(2,14)
	);

	foreach ($rtDefines as $str => $id) {
		defineRTLocalMagic($str,$id[1],$id[0]);
	}

	$dtDefines = array(
	'DT_TITLE' => array(2,1),//TODO : change DT_NAME
	'DT_GIVEN_NAMES' => array(2,33),//TODO : change 2-18 with new update.
	'DT_ALTERNATE_NAME' => array(3,36),//TODO : change 2-2 with new update.
	'DT_CREATOR' => array(2,19),//TODO : change 2-15 with new update.
	'DT_EXTENDED_DESCRIPTION' => array(3,17),//TODO : change 2-4 with new update.
	'DT_QUERY_STRING' => array(2,6),//TODO : change 2-12 with new update.
	'DT_LINKED_RESOURCE' => array(2,4),//TODO : change 2-5  DT_TARGET_RESOURECE with new update.
	'DT_RELATION_TYPE' => array(2,5),//TODO : change 2-6 with new update.
	'DT_NOTES' => array(2,12),	//TODO: change dty to Short summary and remove from code
	'DT_PRIMARY_RESOURCE' => array(2,7),
	'DT_RESOURCE' => array(2,79),//TODO : change 2-13 with new update.
	'DT_FULL_IMAG_URL' => array(70,603),	//TODO: remove from code
	'DT_THUMB_IMAGE_URL' => array(70,606),	//TODO: remove from code
	'DT_ASSOCIATED_FILE' => array(2,38),		//TODO : change 2-38 DT_FILE_RESOURCE with new update.
	'DT_FILE_TYPE'=>array(2,41),
	'DT_GEO_OBJECT' => array(2,11),//TODO : change 2-28 with new update.
	'DT_OTHER_FILE' => array(3,62),
	'DT_LOGO_IMAGE' => array(3,222),
	'DT_THUMBNAIL' => array(2,9),//TODO : change 2-39 with new update.
	'DT_IMAGES' => array(3,224),	//TODO: remove from code
	'DT_DATE' => array(3,16),//TODO : change 2-9 with new update.
	'DT_START_DATE' => array(2,2),//TODO : change 2-10 with new update.
	'DT_END_DATE' => array(2,3),//TODO : change 2-11 with new update.
	'DT_INTERPRETATION_REFERENCE' => array(2,13),//TODO : change 2-8 with new update.
	'DT_ORIGINAL_RECORD_ID' => array(2,589), //TODO : change 2-36 with new update.
	'DT_DOI' => array(3,99),
	'DT_WEBSITE_ICON' => array(3,347),
	'DT_ISBN' => array(3,97),
	'DT_ISSN' => array(3,108),
	'DT_JOURNAL_REFERENCE' => array(3,111),
	'DT_SHORT_SUMMARY' => array(2,12),//TODO : change 2-3 with new update.
	'DT_MEDIA_REFERENCE' => array(3,508),
	'DT_TEI_DOCUMENT_REFERENCE' => array(3,322),
	'DT_START_ELEMENT' => array(3,539),
	'DT_END_ELEMENT' => array(3,540),
	'DT_START_WORD' => array(3,329),
	'DT_END_WORD' => array(3,330),
	'DT_MIME_TYPE' => array(3,48),//TODO : change 2-29 with new update.
	'DT_SERVICE_URL' => array(3,339),//TODO : change 2-34 with new update.
	'DT_MAP_IMAGE_LAYER_SCHEMA' => array(3,585),//TODO : change 2-31 with new update.
	'DT_KML_FILE' => array(3,552),
	'DT_TITLE_SHORT' => array(3,55),
	'DT_KML' => array(3,138),
	'DT_MINMUM_ZOOM_LEVEL' => array(3,586),//TODO : change 2-32 with new update.
	'DT_MAP_IMAGE_LAYER_REFERENCE' => array(3,92),
	'DT_MAXIMUM_ZOOM_LEVEL' => array(3,587),//TODO : change 2-33 with new update.
	'DT_LOCATION' => array(3,181),//TODO : change 2-27 DT_PLACE_NAME with new update.
	'DT_CONTACT_INFO' => array(70,309),//TODO : change 2-17 with new update.
	'DT_SHOW_IN_MAP_BG_LIST' => array(3,679),//show image layer or kml in map background list
	'DT_ANNOTATION_RESOURCE'=>array(2,42),
	'DT_ANNOTATION_RANGE'=>array(2,43),
	'DT_FILTER_STRING'=>array(2,40)
	);//TODOD: add email magic numbers

	foreach ($dtDefines as $str => $id) {
		defineDTLocalMagic($str,$id[1],$id[0]);
	}

	function getRTDefineKeys(){
		global $rtDefines;
		return array_keys($rtDefines);
	}

	function getDTDefineKeys(){
		global $dtDefines;
		return array_keys($dtDefines);
	}

	function defineRTLocalMagic($defString, $rtID,$dbID) {
		$id = rectypeLocalIDLookup($rtID,$dbID);
		if ($id) {
			define($defString,$id);
		}
	}

	function defineDTLocalMagic($defString, $dtID,$dbID) {
		$id = detailtypeLocalIDLookup($dtID,$dbID);
		if ($id) {
			define($defString,$id);
		}
	}

	function rectypeLocalIDLookup($rtID,$dbID = 2) {
		static $RTIDs;
		if (!$RTIDs) {
			$res = mysql_query('select rty_ID as localID,rty_OriginatingDBID as dbID,rty_IDInOriginatingDB as id from defRecTypes order by dbID');
			if (!$res) returnErrorMsgPage('0',"Unable to build internal record type lookup table, MySQL error: ".mysql_error());
			$RTIDs = array();
			while ( $row = mysql_fetch_assoc($res)){
				//		error_log("rt ". print_r($row,true));
				if (!@$RTIDs[$row['dbID']]){
					$RTIDs[$row['dbID']] = array();
				}
				$RTIDs[$row['dbID']][$row['id']] = $row['localID'];
			}
		}
		return (@$RTIDs[$dbID][$rtID] ? $RTIDs[$dbID][$rtID]: null);
	}

	function detailtypeLocalIDLookup($dtID,$dbID = 2) {
		static $DTIDs;
		if (!$DTIDs) {
			$res = mysql_query('select dty_ID as localID,dty_OriginatingDBID as dbID,dty_IDInOriginatingDB as id from defDetailTypes order by dbID');
			if (!$res) returnErrorMsgPage('0',"Unable to build internal field type lookup table, MySQL error: ".mysql_error());
			$DTIDs = array();
			while ( $row = mysql_fetch_assoc($res)){
				if (!@$DTIDs[$row['dbID']]){
					$DTIDs[$row['dbID']] = array();
				}
				$DTIDs[$row['dbID']][$row['id']] = $row['localID'];
			}
		}
		return (@$DTIDs[$dbID][$dtID] ? $DTIDs[$dbID][$dtID]: null);
	}

	function returnErrorMsgPage($critical,$msg) {
		global $dbPrefix;

		if ($critical==1) { // bad connection to MySQL etc.
			echo "<p>&nbsp;<h2>Heurist initialisation error</h2><p> $msg <p><i>Please consult your sysadmin for help, or email: info - a t - heuristscholar.org </i>";
			exit ();
		}

		// gets to here if database not specified properly. This is an error if set up properly, but mot at first initialisaiton of the system
		// Test for existence of databases, if none then Heurist has not been set up yet
		// Placed here rather than up-front test to avoid having to test this in every script
		$query = "show databases";
		$res = mysql_query($query);
		while ($row = mysql_fetch_array($res)) { // only show error message if there are databases
			$test=strpos($row[0],$dbPrefix);
			if (is_numeric($test) && ($test==0) ) { // there are databases
				// echo "<p>&nbsp;<h2>Heurist initialisation error</h2><p> $msg <p><i>Please consult your sysadmin for help, or email: info - a t - heuristscholar.org </i>";
				$msg2= "<p>&nbsp;<h2>Heurist initialisation error</h2><p>".$msg."<p><i>Please consult your sysadmin for help, or email: info - a t - heuristscholar.org </i>";

				if(defined('INITROOT')){
					header("Location: ".HEURIST_BASE_URL."common/html/msgErrorMsg.html?msg=$msg2");
				}else{
					echo "location.replace(\"".HEURIST_BASE_URL."common/html/msgErrorMsg.html?msg=$msg2\");";
				}

		/*		echo "location.replace(\"".HEURIST_BASE_URL."common/html/msgErrorMsg.html?msg='<p>&nbsp;<h2>Heurist initialisation error</h2><p>
												$msg <p><i>Please consult your sysadmin for help, or email: info - a t - heuristscholar.org </i>'\");";


*/



				exit ();
			}
		}
		exit(); // it will drop through to here without an error message if the system has not been set up yet
		}
?>
