<?php
ini_set("session.save_path", "/var/www/jasetheace.com/sessions");
ini_set("session.gc_maxlifetime", "14400");

session_start();

function GetRemoteIp() {
  $ip = $_SERVER['REMOTE_ADDR'];
  if ($ip == '192.168.13.1') {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
  }
  return $ip;
}

function LogIn($y=0) {
  global $NoLoginRedirect;
  if (isset($NoLoginRedirect)) {
    #  Send json error
    $ret[msg] = "Error - not authenticated ($y)";
    echo json_encode($ret);
    exit;
  }
  $ip = GetRemoteIp();
  $Title = 'Login';
  require_once 'header.inc';
  include 'login.inc';
  print "\n<!-- reason = $y -->";
  if ($y == 3) {
    print "\n<!-- old ip = $_SESSION[IP], new ip = $ip -->";
  }
  include 'footer.inc';
  exit;
}

if (isset($_POST['Email']) and isset($_POST['Pass'])) {
  $Email = pg_escape_string($_POST['Email']);
  $Pass = pg_escape_string($_POST['Pass']);
  $Sql = "SELECT id, realname, nickname FROM pickers WHERE email='$Email' and password='$Pass' and year=$CurYear";
  $result = dbquery($Sql,false);
  if (count($result) > 0) {
    #print "Logged in!";
    $_SESSION['id'] = $result[0]['id'];
    $_SESSION['RealName'] = htmlentities($result[0]['realname']);
    $_SESSION['NickName'] = htmlentities($result[0]['nickname']);
    $_SESSION['Email'] = $_POST['Email'];
    $_SESSION['IP'] = GetRemoteIp();
    $_SESSION['CurYear'] = $CurYear;
    unset($_SESSION['Winner']);
    unset($_SESSION['Value']);
    $_SESSION['Error'] = "";
    unset($_SESSION['Error']);
    unset($_SESSION['ErrorWeeks']);
    unset($_SESSION['Unused']);

    #  Set the tags
    $Sql = "SELECT t.id, t.name from tags t, pickertags p where p.pickerid=$_SESSION[id] and p.tagid=t.id order by t.name";
    $result = dbquery($Sql,false);
    if (count($result) > 0) {
      $_SESSION['Tags'] = array();
      $_SESSION['Tags'][0] = "All";
      foreach ($result as $row) {
        $_SESSION['Tags'][$row['id']] = $row['name'];
      }
      $_SESSION['CurTag'] = 0;
    } else {
      unset($_SESSION['Tags']);
      unset($_SESSION['CurTag']);
    }

    # Redirect
    #header("Location: ".htmlentities($_SERVER['PHP_SELF']));
    header("Location: /footballpicks/");
    #phpinfo();
  } else {
    sleep(5);
    LogIn();
    exit;
  }
}
if (!isset($_SESSION['id'])) {
  LogIn(1);
}
if ($_SESSION['id']==0) {
  LogIn(2);
}
#if ($_SESSION['IP'] != $_SERVER['REMOTE_ADDR']) {
#  $_SESSION['id']=0;
#  LogIn(3);
#}
$ip_net = 'ip-unknown';
$remote_addr_net = 'remote-ip-unknown';
if (preg_match('/(.*)\./',$_SESSION['IP'],$regs)) {
  $ip_net = $regs[1];
}
$ip = GetRemoteIp();
if (preg_match('/(.*)\./',$ip,$regs)) {
  $remote_addr_net = $regs[1];
}
#print "ip_net = $ip_net, remote_addr_net = $remote_addr_net";
if ($ip_net != $remote_addr_net) {
  $_SESSION['id']=0;
  LogIn(3);
}
if (empty($_SESSION['CurYear'])) {
  Login(4);
}
if ($_SESSION['CurYear'] != $CurYear) {
  Login(5);
}

if (isset($_SESSION['su'])) {
  $SessId = $_SESSION['su'];
  $Sql = "select nickname from pickers where id=$SessId";
  $result = dbquery($Sql,false);
  $SessName = $result[0]['nickname'];
} else {
  $SessId = $_SESSION['id'];
  $SessName = $_SESSION['NickName'];
}
