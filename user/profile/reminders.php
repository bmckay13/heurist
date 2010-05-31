<?php

require_once(dirname(__FILE__).'/../../common/connect/cred.php');
require_once(dirname(__FILE__).'/../../common/connect/db.php');

if (! is_logged_in()) {
	header('Location: ' . HEURIST_URL_BASE . 'common/connect/login.php');
	return;
}

if (@$_REQUEST["action"] == "delete"  &&  @$_REQUEST["rem_id"]) {
	mysql_connection_db_overwrite(DATABASE);
	mysql_query("delete from reminders where rem_id = " . intval($_REQUEST["rem_id"]) . " and rem_owner_id = " . get_user_id());
}

$future = (! @$_REQUEST["show"]  ||  $_REQUEST["show"] === "future");

?>
<html>
 <head>
  <title>Heurist reminders</title>
  <link rel="icon" href="<?=HEURIST_SITE_PATH?>favicon.ico" type="image/x-icon">
  <link rel="shortcut icon" href="<?=HEURIST_SITE_PATH?>favicon.ico" type="image/x-icon">
  <link rel="stylesheet" type="text/css" href="<?=HEURIST_SITE_PATH?>css/newshsseri.css">
  <style>
   div#page { padding: 10px; }
   div#page .headline { margin-bottom: 10px; }
   div#page img { border: none; }
  </style>
  <script>
	function del(rem_id) {
		document.getElementById("rem_id_input").value = rem_id;
		document.getElementById("action_input").value = "delete";
		document.getElementById("action_input").form.submit();
	}
  </script>
 </head>
 <body width=700 height=600>
  <div id=page>
   <div class=headline>Reminders</div>

   <form>
    <label for=show-future>
     <input type=radio name=show value=future id=show-future <?= $future ? "checked" : "" ?> onchange="form.submit();">
     Show future reminders only
    </label>
    <br>
    <label for=show-all>
     <input type=radio name=show value=all id=show-all <?= $future ? "" : "checked" ?> onchange="form.submit();">
     Show all reminders
    </label>
   </form>

   <form method=post>
    <input type=hidden name=rem_id id=rem_id_input>
    <input type=hidden name=action id=action_input>
   </form>

   <table cellspacing=20>
    <tr>
     <th></th>
     <th>Record</th>
     <th>Recipient</th>
     <th>Notification frequency</th>
     <th>Message</th>
    </tr>
<?php

mysql_connection_db_select(DATABASE);

$future_clause = $future ? "and rem_freq != 'once' or rem_startdate > now()" : "";

$res = mysql_query("select reminders.*, rec_title, grp_name, cgr_name, concat(".USERS_FIRSTNAME_FIELD.",' ',".USERS_LASTNAME_FIELD.") as username
					  from reminders
				 left join records on rec_id = rem_rec_id
				 left join ".USERS_DATABASE.".".GROUPS_TABLE." on ".GROUPS_ID_FIELD." = rem_wg_id
				 left join coll_groups on cgr_id = rem_cgr_id
				 left join ".USERS_DATABASE.".".USERS_TABLE." on ".USERS_ID_FIELD." = rem_usr_id
					 where rem_owner_id = " . get_user_id() . "
					 $future_clause
				  order by rem_rec_id, rem_startdate");

print(mysql_error());

if (mysql_num_rows($res) == 0) {
	print "<tr><td></td><td colspan=4>No reminders</td></tr>";
}

while ($row = mysql_fetch_assoc($res)) {
	$recipient = $row[GROUPS_NAME_FIELD] ? $row[GROUPS_NAME_FIELD] :
					($row["cgr_name"] ? $row["cgr_name"] :
						($row["username"] ? $row["username"] : $row["rem_email"]));
?>
    <tr>
     <td><a title=delete href=# onclick="del(<?= $row["rem_id"] ?>); return false;"><img src="<?=HEURIST_SITE_PATH?>common/images/cross.gif"></a></td>
     <td><a href="<?=HEURIST_SITE_PATH?>data/records/editrec/heurist-edit.html?bib_id=<?= $row["rem_rec_id"] ?>#personal"><b><?= $row["rec_title"] ?></b></a></td>
     <td><b><?= $recipient ?></b></td>
     <td><b><?= $row["rem_freq"] ?></b> from <b><?= $row["rem_startdate"] ?></b></td>
     <td><?= $row["rem_message"] ?></td>
    </tr>
<?php
}

?>
  </div>
 </body>
</html>
