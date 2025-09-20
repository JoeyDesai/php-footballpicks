<?php 
#dl ('pgsql.so');
$dbuser='footballusr';
$dbpass='pickcowboys';
$dbname='football';

$conn=pg_pconnect("host=localhost dbname=$dbname user=$dbuser password=$dbpass") or die ('Could not connect: ' . pg_last_error());

function dbquery($Sql, $debug=0) {
  global $conn;
  if ($debug) {
    print "\n<!-- $Sql -->\n";
  }
  $ret = array();
  $result = pg_query($Sql) or die('Query failed: ' . pg_last_error());
  while ($tmp =  pg_fetch_assoc($result)) {
    $ret[] = $tmp;
  }
  return $ret;
}