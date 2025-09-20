<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$NoLoginRedirect = 1;
require_once '../common.inc';

$response = array();

if (isset($_SESSION['id']) && $_SESSION['id'] > 0) {
    $response['authenticated'] = true;
    $response['user'] = array(
        'id' => $_SESSION['id'],
        'email' => $_SESSION['Email'],
        'nickname' => $_SESSION['NickName'],
        'realName' => $_SESSION['RealName']
    );
} else {
    $response['authenticated'] = false;
}

echo json_encode($response);
?>