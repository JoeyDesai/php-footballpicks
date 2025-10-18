<?php
#  Loop through each game, setting the losers as needed
$Sql = "SELECT id, home, away, winner, loser FROM games WHERE winner is
not null and winner = COALESCE(loser, winner)";
$result = dbquery($Sql);
foreach ($result as $row) {
   $home = $row['home'];
   $away = $row['away'];
   $winner = $row['winner'];
   #$dbloser = $row['loser'];
   $id = $row['id'];
   if ($winner == 0) {
     $loser = $winner;
   } else if ($winner == $home) {
     $loser = $away;
   } else {
     $loser = $home;
   }
   #if ($dbloser != $loser) {
     $Sql = "UPDATE games SET winner=$winner, loser=$loser WHERE id=$id";
     dbquery($Sql);
   #}
}
?>