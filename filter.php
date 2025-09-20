<?php
$NoHeader = true;
$NoWeeksNav = true;
include "common.inc";

#  This script will set the session variable for the current tag to filter on
if (isset($_POST['tagid'])) {
    if (isset($_SESSION['Tags'][$_POST['tagid']])) {
        $_SESSION['CurTag'] = $_POST['tagid'];
    } else {
        $_SESSION['CurTag'] = 0;
    }
}

#  Redirect back to where we came from
$Ref = $_SERVER['HTTP_REFERER'];
if (strpos($Ref, "filter.php") !== false || strpos($Ref, "login.php") !== false) {
    $Ref = "/footballpicks/";
}
header("Location: $Ref");
exit();