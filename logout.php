<?php
ini_set("session.save_path", "/var/www/jasetheace.com/sessions");
ini_set("session.gc_maxlifetime", "14400");

session_start();
$_SESSION['id']=0;
?>

You have been logged out.  <a href=".">Back to Football Picks</a>
