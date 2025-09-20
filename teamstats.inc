<?php 
function nvl($var, $ifnot) {
  if (!isset($var)) {
    return $ifnot;
  }
  return $var;
}
function show_teamstats() {
	global $CurYear;
	
	# Set up SQL statement to query the database
	$Sql = "select teams.name, sum(picks.weight) as totalweight, count(picks.weight) as totalcount
		from teams, games, picks, weeks
		where games.id = picks.game and games.winner = teams.id
		and picks.guess = games.winner
		and games.week = weeks.id and weeks.year = $CurYear
		group by teams.name
		order by name asc";
	
	# Run the query, putting the results into an array of arrays by running
	# my custom function I created
	$resultWon = dbquery($Sql, true);

	for ($i = 0; $i < count($resultWon); $i++) {
		$stats[$resultWon[$i]["name"]]["wonweight"] = $resultWon[$i]["totalweight"];
		$stats[$resultWon[$i]["name"]]["woncount"] = $resultWon[$i]["totalcount"];
	}
	
	# Set up SQL statement to query the database
	$Sql = "select teams.name, sum(picks.weight) as totalweight, count(picks.weight) as totalcount
		from teams, games, picks, weeks
		where games.id = picks.game and games.loser = teams.id
		and picks.guess = games.loser
		and games.week = weeks.id and weeks.year = $CurYear
		group by teams.name
		order by name asc";
	
	# Run the query, putting the results into an array of arrays by running
	# my custom function I created
	$resultLost = dbquery($Sql, true);

	for ($i = 0; $i < count($resultLost); $i++) {
		$stats[$resultLost[$i]["name"]]["lostweight"] = $resultLost[$i]["totalweight"];
		$stats[$resultLost[$i]["name"]]["lostcount"] = $resultLost[$i]["totalcount"];
	}

	# Print out the beginning of the table
	print "<table id=\"bigstats\" class=\"sortable smallstats\">\n";
	#print "<table id=\"bigstats\" class=\"sortable\">\n";
	print "<tr><th>Team</th>
		<th>Points Won</th>
		<th>Correctly Picked</th>
		<th>Points Lost</th>
		<th>Wrongly Picked</th>
		<th>Total Points</th>
		<th>Total Times Picked</th></tr>";
	
	$currentrow = 1;
	$even = true;
	foreach ($stats as $Team => $arr) {
		$srow = "";
		#if($even){
		#	$srow = " class=\"even\"";
		#	$even = false;
		#} else {
		#	$even = true;
		#}

		if (!isset($arr["wonweight"])) {
		  $arr["wonweight"] = 0;
		}
		if (!isset($arr["lostweight"])) {
		  $arr["lostweight"] = 0;
		}
		if (!isset($arr["woncount"])) {
		  $arr["woncount"] = 0;
		}
		if (!isset($arr["lostcount"])) {
		  $arr["lostcount"] = 0;
		}
		
		$totalPoints = nvl($arr["wonweight"],0) + nvl($arr["lostweight"],0);
		$totalTimesPicked = nvl($arr["woncount"],0) + nvl($arr["lostcount"],0);
		
		# Print out the row
		print "<tr" . $srow . ">";
		print "<td>$Team</td>";
		print "<td>" . nvl($arr["wonweight"],0) . "</td>";
		print "<td>" . nvl($arr["woncount"],0) . "</td>";
		print "<td>" . nvl($arr["lostweight"],0) . "</td>";
		print "<td>" . nvl($arr["lostcount"],0) . "</td>";
		print "<td>" . $totalPoints . "</td>";
		print "<td>" . $totalTimesPicked . "</td>";
		print "</tr>";
	}
	
	
	# Print out the end of the table
	print "</table>\n";
}
?>
