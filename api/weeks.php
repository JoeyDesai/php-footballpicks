<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../common.inc';

$response = array();

try {
    $Sql = "SELECT id, number, startdate, startdate > now() as future, startdate < now() as old, factor FROM weeks WHERE year=$CurYear ORDER BY startdate";
    $result = dbquery($Sql);
    
    $weeks = array();
    foreach ($result as $row) {
        $weeks[] = array(
            'id' => (int)$row['id'],
            'number' => (int)$row['number'],
            'startdate' => $row['startdate'],
            'future' => $row['future'] === 't',
            'completed' => $row['old'] === 't',
            'current' => $row['future'] === 'f' && $row['old'] === 'f',
            'factor' => (float)$row['factor']
        );
    }
    
    $response['success'] = true;
    $response['weeks'] = $weeks;
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = 'Failed to load weeks';
}

echo json_encode($response);
?>