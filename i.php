<?php 
function GetRemoteIp() {
  $ip = $_SERVER['REMOTE_ADDR'];
  if ($ip == '192.168.13.1') {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
  }
  return $ip;
}
$ip = GetRemoteIp();
print "IP = $ip ";
print_r($_SERVER); 
phpinfo();
