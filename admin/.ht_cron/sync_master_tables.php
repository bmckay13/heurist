<?php

/* Copies the Heurist "master" tables:
 *
 * rec_types
 * red_detail_types
 * rec_detail_lookups
 * rec_detail_requirements
 *
 * from the "heurist-common" database to each of the Heurist instance databases
 *
 * Kim Jackson, April 2008
 */

require_once(dirname(__FILE__).'/../../common/config/heurist-instances.php');
require_once(dirname(__FILE__).'/../../common/connect/db.php');

foreach (get_all_instances() as $instance_name => $instance) {

	if ($instance_name == 'reference') continue; //FIXME change this so that we can synch to a give databases definitions

	mysql_connection_db_overwrite($instance["db"]);

	mysql_query("START TRANSACTION");
	mysql_query("DELETE FROM rec_types");
	mysql_query("INSERT INTO rec_types SELECT * FROM `heurist-common`.rec_types");
	mysql_query("DELETE FROM ontologies");
	mysql_query("INSERT INTO ontologies SELECT * FROM `heurist-common`.ontologies");
	mysql_query("DELETE FROM rel_constraints");
	mysql_query("INSERT INTO rel_constraints SELECT * FROM `heurist-common`.rec_constraints");
	mysql_query("DELETE FROM rec_detail_types");
	mysql_query("INSERT INTO rec_detail_types SELECT * FROM `heurist-common`.rec_detail_types");
	mysql_query("DELETE FROM rec_detail_lookups");
	mysql_query("INSERT INTO rec_detail_lookups SELECT * FROM `heurist-common`.rec_detail_lookups");
	mysql_query("DELETE FROM rec_detail_requirements");
	mysql_query("INSERT INTO rec_detail_requirements SELECT * FROM `heurist-common`.rec_detail_requirements");
	mysql_query("COMMIT");

	if (@$_SERVER["HTTP_HOST"]) {
		print "<p>Master record type info copied to instance: $instance_name</p>\n";
	}
}

if (@$_SERVER["HTTP_HOST"]) {
	print "<p>Synchronised all instances OK</p>\n";
}

