<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

ini_set("session.save_path", "/var/www/jasetheace.com/sessions");
ini_set("session.gc_maxlifetime", "14400");

session_start();
$_SESSION['id'] = 0;
session_destroy();

$response = array('success' => true);
echo json_encode($response);
?>