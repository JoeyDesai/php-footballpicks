<?php 
#include "logout.php";
#exit;
$CurYear=2025;
require_once 'sql.inc';
function isnum($num) {
  return (preg_match('/^[0-9]+$/', $num));
}
function check_num($num) {
  if (!isnum($num)) {
    die ("Error - not a valid number!");
  }
}
function isdate($str) {
  return (preg_match('/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/', $str));
}
function check_date($str) {
  if (!isdate($str)) {
    die ("Error - not a valid date!");
  }
}
if (!isset($NoLogin)) {
  require_once 'checklogin.inc';
}
if (!isset($NoHeader)) {
  require_once 'header.inc';
}
if (!isset($NoLogin) and !isset($NoWeeksNav)) {
  include 'weeksnav.inc';
}
?>
