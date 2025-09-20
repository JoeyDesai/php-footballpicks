<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Set up session and database connection using existing system
$NoLoginRedirect = 1;
require_once '../common.inc';

$response = array();

// Check if user is logged in using existing session system
if (isset($_SESSION['id']) && $_SESSION['id'] > 0) {
    $response['authenticated'] = true;
    $response['user'] = array(
        'id' => $_SESSION['id'],
        'email' => isset($_SESSION['Email']) ? $_SESSION['Email'] : '',
        'nickname' => isset($_SESSION['NickName']) ? $_SESSION['NickName'] : '',
        'realName' => isset($_SESSION['RealName']) ? $_SESSION['RealName'] : ''
    );
} else {
    $response['authenticated'] = false;
}

echo json_encode($response);
?>