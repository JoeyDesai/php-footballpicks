<?php
$Title = 'Jase the Ace Football Picks';
require_once 'common.inc';

#print "Hello there " . $_SESSION['NickName']
#if (isset($_SESSION['Tags'])) {
#  print "<br>Your tags: ";
#  print_r($_SESSION['Tags']);
#} else {
#  print "<br>You have no tags set.";
#}

#  Provide links to weeks to do picks for
#$Sql = "SELECT id, number FROM weeks WHERE startdate > now()";
#$result = dbquery($Sql,true);
#foreach ($result as $row) {
#  print "\n<br><a href=\"picks.php?week=".$row['id']."\">Week ".$row['number']."</a>";
#}
?>
<p>You do NOT have to pick your favorite team, but if you don't give them at least 1 point, you may suffer ridicule.</p>
<p>New this year - ties will give you half of your points. (Will wait to code this until there is an actual tie). </p>

<?php
#  Provide quick links to this weeks picks and last weeks results
#  This week's picks
$Sql = "SELECT id, number, startdate, to_char(startdate, 'Day Month DD HH12:MI AM') as start FROM weeks WHERE year=$CurYear AND startdate > now() ORDER BY startdate LIMIT 1";
$Result = dbquery($Sql);
if (count($Result)) {
  $Id = $Result[0]['id'];
  $Num = $Result[0]['number'];
  $StartDate = $Result[0]['start'];
  print "<div><a href=picks.php?week=$Id>Enter Week $Num picks</a> before $StartDate, or select a week above to do your picks for future weeks.</div>";
}

#  Last week's results
$Sql = "SELECT id, number, startdate FROM weeks WHERE year=$CurYear AND startdate < now() ORDER BY startdate DESC LIMIT 1";
$Result = dbquery($Sql);
if (count($Result)) {
  $Id = $Result[0]['id'];
  $Num = $Result[0]['number'];
}

include "general-stats2.inc";

print "\n<br>";

?>
<div>
<?php
show_lastweek("<a href=group.php?week=$Id>Week $Num Top Scores</a>");
show_leaders("<a href=group.php>Overall Top Scores</a>");
?>
</div>
<div class="main2">
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<a href="teamstats.php">Interesting Team Pick Stats</a>
<p>This is Jase the Ace Football Picks.  Each week you must not only select which team will win, but give each game a point value.  If you get the pick correct, you get the points you assigned to it.  Please let me know if you notice any problems.</p>
</div>
<?php
if ($_SESSION['Email'] == 'jase@jasetheace.com' or $_SESSION['Email'] == 'jj') {
  print "<a href=admin/>Admin Options</a>";
}
if ($_SESSION['Email'] == 'jase@jasetheace.com') {
  print " <a href=admin/su.php>Switch User</a>";
}
#if ($_SESSION['Email'] == 'sofaspud518@cox.net') {
#  print "<a href=admin/weeks.php?Year=2006>Manage Weeks</a>";
#}
include 'footer.inc';
?>
