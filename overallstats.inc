<?php 
#  Overall Stats
?>
<div><span class="pgtitle">Group Statistics</span><span class="instructions"> &nbsp; Click the weeks to see group results.</span></div>
<table class="sortable dtable" id="mytable">
<tr><th class="statheader">#</th><th class="statheader">Name</th>
<th class="total">Total</th><th class="count">(#)&nbsp;</th>
<?php 
$Sql = "SELECT id, number FROM weeks WHERE startdate < now() AND year=$CurYear ORDER BY startdate DESC";
$result = dbquery($Sql);
foreach ($result as $row) {
  $num = $row['number'];
  #print "<th><a class=\"weeknav\" href=\"group.php?week=$num\">$num</a></th>\n";
  print "<th class=\"total\">$num</th><th class=\"count\">(#)</th>\n";
}
?>
</tr>
<?php 
#  Loop through each person
$Sql = "SELECT p.id as pid, p.nickname as nickname, t.score as score, t.numright as numright FROM pickers p, totalscore t WHERE t.year=$CurYear AND t.picker = p.id AND p.active='y' and p.year=t.year";
if (isset($_SESSION['CurTag']) and $_SESSION['CurTag'] != 0) {
	$Sql .= " AND p.id IN (SELECT pickerid FROM pickertags WHERE tagid = $_SESSION[CurTag])";
}
$Sql .= " ORDER BY t.score DESC, t.numright DESC";
$Count=0;
$result2 = dbquery($Sql);
foreach ($result2 as $person) {
  $Count++;
  $Name = htmlentities($person['nickname']);
  $Pid = $person['pid'];
  $TotalScore = $person['score'];
  $TotalRight = $person['numright'];
  if ($Pid == $_SESSION['id']) {
    $TrOpts = " class=\"myname\"";
  } else {
    $TrOpts = "";
  }
  print "<tr$TrOpts><td class=\"name\" nowrap>$Count</td><td class=\"name\" nowrap>$Name</td>";
  print "<td class=\"total\" nowrap align=\"right\">$TotalScore</td><td class=\"count\">$TotalRight</td>";
  #  Loop through each week
  foreach ($result as $week) {
    $Wid = $week['id'];
    $Sql = "SELECT score, numright FROM scores WHERE picker=$Pid and week=$Wid";
    $result3 = dbquery($Sql);
    if (count($result3) > 0) {
      $Score = $result3[0]['score'];
      $NumRight = $result3[0]['numright'];
    } else {
      $Score = "Err";
      $NumRight = "Err";
      #  Rather than show errors, it is likely erroring because we are in the middle of updating.  So delay and refresh
      sleep(5);
      header('Location: '.$_SERVER['REQUEST_URI']);
      exit;
    }
    print "<td nowrap align=\"right\">$Score</td><td class=\"count\" align=\"right\">$NumRight</td>";
  }

  print "</tr>\n";
}
?>
</table>
