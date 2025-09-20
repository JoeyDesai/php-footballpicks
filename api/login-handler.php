<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Use existing authentication system
$NoLogin = 1;
require_once '../common.inc';

$response = array();

if (isset($_POST['Email']) && isset($_POST['Pass'])) {
    $Email = pg_escape_string($_POST['Email']);
    $Pass = pg_escape_string($_POST['Pass']);
    $Sql = "SELECT id, realname, nickname FROM pickers WHERE email='$Email' and password='$Pass' and year=$CurYear";
    $result = dbquery($Sql, false);
    
    if (count($result) > 0) {
        // Set up session using existing system
        $_SESSION['id'] = $result[0]['id'];
        $_SESSION['RealName'] = htmlentities($result[0]['realname']);
        $_SESSION['NickName'] = htmlentities($result[0]['nickname']);
        $_SESSION['Email'] = $_POST['Email'];
        $_SESSION['IP'] = GetRemoteIp();
        $_SESSION['CurYear'] = $CurYear;
        
        // Clear any existing error states
        unset($_SESSION['Winner']);
        unset($_SESSION['Value']);
        $_SESSION['Error'] = "";
        unset($_SESSION['Error']);
        unset($_SESSION['ErrorWeeks']);
        unset($_SESSION['Unused']);

        // Set the tags using existing system
        $Sql = "SELECT t.id, t.name from tags t, pickertags p where p.pickerid=$_SESSION[id] and p.tagid=t.id order by t.name";
        $tagResult = dbquery($Sql, false);
        if (count($tagResult) > 0) {
            $_SESSION['Tags'] = array();
            $_SESSION['Tags'][0] = "All";
            foreach ($tagResult as $row) {
                $_SESSION['Tags'][$row['id']] = $row['name'];
            }
            $_SESSION['CurTag'] = 0;
        } else {
            unset($_SESSION['Tags']);
            unset($_SESSION['CurTag']);
        }
        
        $response['success'] = true;
        $response['user'] = array(
            'id' => $_SESSION['id'],
            'email' => $_SESSION['Email'],
            'nickname' => $_SESSION['NickName'],
            'realName' => $_SESSION['RealName']
        );
    } else {
        sleep(5); // Same delay as original system for failed logins
        $response['success'] = false;
        $response['error'] = 'Invalid email or password';
    }
} else {
    $response['success'] = false;
    $response['error'] = 'Email and password required';
}

echo json_encode($response);
?>