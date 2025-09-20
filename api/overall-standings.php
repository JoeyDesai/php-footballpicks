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
$tag = isset($_GET['tag']) ? (int)$_GET['tag'] : 0;

try {
    $Sql = "SELECT p.id as pid, p.nickname as nickname, t.score as score, t.numright as numright 
            FROM pickers p, totalscore t 
            WHERE t.year=$CurYear AND t.picker = p.id AND p.active='y' and p.year=t.year";
    
    if ($tag != 0) {
        $Sql .= " AND p.id IN (SELECT pickerid FROM pickertags WHERE tagid = $tag)";
    }
    
    $Sql .= " ORDER BY t.score DESC, t.numright DESC";
    
    $result = dbquery($Sql);
    
    $standings = array();
    foreach ($result as $row) {
        // Calculate weeks played
        $weeksSql = "SELECT COUNT(*) as weeks_played FROM scores WHERE picker=" . $row['pid'];
        $weeksResult = dbquery($weeksSql);
        $weeksPlayed = (int)$weeksResult[0]['weeks_played'];
        
        $standings[] = array(
            'id' => (int)$row['pid'],
            'nickname' => $row['nickname'],
            'score' => (int)$row['score'],
            'numright' => (int)$row['numright'],
            'weeks_played' => $weeksPlayed
        );
    }
    
    $response['success'] = true;
    $response['standings'] = $standings;
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = 'Failed to load overall standings';
}

echo json_encode($response);
?>