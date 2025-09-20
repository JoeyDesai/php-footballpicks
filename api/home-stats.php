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
    // Get current week
    $Sql = "SELECT id, number FROM weeks WHERE year=$CurYear AND startdate < now() ORDER BY startdate DESC LIMIT 1";
    $weekResult = dbquery($Sql);
    
    if (count($weekResult) > 0) {
        $currentWeek = array(
            'id' => (int)$weekResult[0]['id'],
            'number' => (int)$weekResult[0]['number']
        );
        
        // Get weekly standings for current week
        $weekId = $currentWeek['id'];
        $Sql = "SELECT pr.id, pr.nickname, s.score, s.numright 
                FROM pickers pr, scores s 
                WHERE pr.id = s.picker AND pr.active='y' AND s.week=$weekId and pr.year=$CurYear 
                ORDER BY s.score DESC, s.numright DESC 
                LIMIT 5";
        $weeklyResult = dbquery($Sql);
        
        $weeklyStandings = array();
        foreach ($weeklyResult as $row) {
            $weeklyStandings[] = array(
                'id' => (int)$row['id'],
                'nickname' => $row['nickname'],
                'score' => (int)$row['score'],
                'numright' => (int)$row['numright']
            );
        }
        
        $response['success'] = true;
        $response['currentWeek'] = $currentWeek;
        $response['weeklyStandings'] = $weeklyStandings;
    } else {
        $response['success'] = true;
        $response['currentWeek'] = null;
        $response['weeklyStandings'] = array();
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = 'Failed to load home stats';
}

echo json_encode($response);
?>