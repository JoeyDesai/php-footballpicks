<?php 
# This file will define functions to create tables with some generic statistics
#
# Each function will have some comments as to its purpose
#
# An Example is provided at first, and the database schema is provided in 
# comments at the bottom of this file
#

#################### show_leaders(numrows)
#
# This function should create a table showing the top pickers.  The columns
# that should be shown are "Name", and "Score(#picks)"
# - numrows is the number of rows to show.  

function show_leaders($Title, $numrows = 5) {
	# Get access to the global variable which defines our current year
	global $CurYear;  
	
	# Set up SQL statement to query the database
	$Sql = "SELECT p.nickname, sum(s.score) as totscore, sum(s.numright) as totnumright
		FROM pickers p, scores s, weeks w
		WHERE p.id = s.picker AND s.week = w.id AND w.startdate < now() AND w.year = $CurYear and w.year = p.year";
	if (isset($_SESSION['CurTag']) and $_SESSION['CurTag'] != 0) {
		$Sql .= " AND p.id IN (SELECT pickerid FROM pickertags WHERE tagid = $_SESSION[CurTag])";
	}
	$Sql .= "
		GROUP BY p.id
		ORDER BY totscore DESC, totnumright DESC
		LIMIT $numrows
		";
	
	# Run the query, putting the results into an array of arrays by running
	# my custom function I created
	$result = dbquery($Sql, true);
	
	# Print out the beginning of the table
	print "<table class=\"smallstats\">\n";
	print "<tr><th colspan=3 class=\"title\">$Title</th></tr>\n";
	print "<tr><th>Pos.</th><th>Name</th><th>Score</th></tr>";

	# Loop through all the results of the query
	$currentrow = 1;
	$even = true;
	foreach ($result as $row) {
		# Print out the row
		$srow = "";
		if($even){
			$srow = " class=\"even\"";
			$even = false;
		} else {
			$even = true;
		}
		
		print "<tr" . $srow . "><td>" . $currentrow . ".</td><td>" . $row["nickname"] . "</td><td>" . $row["totscore"] . " (" .
			$row["totnumright"] . ")</td></tr>\n";
		
		$currentrow++;
	}
	
	# Print out the end of the table
	print "</table>\n";
}

#################### show_lastweek(Title, numrows)
#
# This function should create a table showing the top pickers.  The columns
# that should be shown are "Name", and "Score(#picks)"
# - Title is the title to be shown at the top of the table
# - numrows is the number of rows to show.  

function show_lastweek($Title, $numrows = 5) {
	# Get access to the global variable which defines our current year
	global $CurYear;
	
	# Set up SQL statement to query the database
	$Sql = "SELECT p.nickname, sum(s.score) as totscore, sum(s.numright) as totnumright
		FROM pickers p, scores s, weeks w
		WHERE p.id = s.picker AND s.week = w.id AND p.year = $CurYear
		AND w.id = (SELECT id FROM weeks WHERE startdate < now() ORDER BY startdate DESC limit 1)";
	if (isset($_SESSION['CurTag']) and $_SESSION['CurTag'] != 0) {
		$Sql .= " AND p.id IN (SELECT pickerid FROM pickertags WHERE tagid = $_SESSION[CurTag])";
	}
	$Sql .= "
		GROUP BY p.id
		ORDER BY totscore DESC, totnumright DESC
		LIMIT $numrows
		";
	
	# Run the query, putting the results into an array of arrays by running
	# my custom function I created
	$result = dbquery($Sql, true);
	
	# Print out the beginning of the table
	print "<table class=\"smallstats\">\n";
	print "<tr><th colspan=3 class=\"title\">" . $Title . "</th></tr>\n";
	print "<tr><th>Pos.</th><th>Name</th><th>Score</th></tr>";
	
	# Loop through all the results of the query
	$currentrow = 1;
	$even = true;
	foreach ($result as $row) {
		# Print out the row
		$srow = "";
		if($even){
			$srow = " class=\"even\"";
			$even = false;
		} else {
			$even = true;
		}
		
		print "<tr" . $srow . "><td>" . $currentrow . ".</td><td>" . $row["nickname"] . "</td><td>" . $row["totscore"] . " (" .
			$row["totnumright"] . ")</td></tr>\n";
		
		$currentrow++;
	}
	
	# Print out the end of the table
	print "</table>\n";
}

# Required Database Schema
#
# -- Table: pickers - user id's and names
# id - primary key
# nickname - name to display
#
#
# -- Table: weeks
# id - primary key
# "year" - football season year number (currently 2006)
# number - week number (1 - 17)
# startdate - date/time that the first game of the week starts
#
#
# -- Table: scores - user's scores for each week
# picker - foreign key to picker(id)
# week - foreign key to week(id)
# score - picker's score for that week
# numright - number of picks correct for that week
#
# -- Table: teams
# id - primary key
# name - Team name (Cowboys)
# city - Team city (Dallas)
#
# -- Table: games - info about a particular game
# id - primary key
# home - home team - foreigh key to teams(id)
# away - away team - foreigh key to teams(id)
# date - date/time of game
# week - foreign key to week(id)
# winner - which teams(id) won the game
# loser - which teams(id) lost the game
#
# -- Table: picks - a user's picks and guesses
# game - foreign key to games(id)
# guess - which team(id) from the game is picked to win
# weight - number of points assigned to this guess

?>
