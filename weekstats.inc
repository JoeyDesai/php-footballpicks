<?php 
#  Get Week Stats
print "<div class=\"pgtitle\">Week $weeknum Group Stats</div>";
?>
<table class="stats dTable">
<tr valign="top" class="nohover"><th class="homecell">#</th><th class="homecell">Name</th>
<?php 
$tr2 = "<tr valign=\"top\" class=\"nohover\"><th class=\"infocell\">&nbsp;</th><th class=\"infocell\">&nbsp;</th>";
#  Get all of the games
$Sql = "SELECT g.id as gid, g.winner, a.abbr as aabbr, h.abbr as habbr, g.awayscore, g.homescore, g.time, g.info FROM games g, teams a, teams h WHERE g.week=$week AND g.away = a.id AND g.home = h.id ORDER BY g.date, a.abbr";
$games = dbquery($Sql);
#$foot = "<br><img width=\"10px\" src=\"/footballpicks/images/football.png\" />";
$foot = "<br><i class=\"fas fa-football-ball\"></i>";
foreach($games as $game) {
  $Away = $game['aabbr'];
  $Home = $game['habbr'];
  $Ascore = $game['awayscore'];
  $Hscore = $game['homescore'];
  $Time = $game['time'];
  $info = json_decode($game['info']);
  $Afoot = "";
  $Hfoot = "";
  $AwayHead = "$Away<br>$Ascore";
  $HomeHead = "$Home<br>$Hscore";
  if (!empty($info) and !preg_match('/final/i',$info->qtr) and isset($info->home->score->T)) {
    if ($info->posteam == $info->home->abbr) {
      $HomeHead .= $foot;
      #if (!empty($info->redzone)) {
      #  $HomeHead = "<span color=red>$HomeHead</span>";
      #}
    } else if ($info->posteam == $info->away->abbr) {
      $AwayHead .= $foot;
      #if (!empty($info->redzone)) {
      #  $AwayHead = "<span color=red>$AwayHead</span>";
      #}
    }
    if (preg_match("/^\d$/",$info->qtr)) {
      $info->qtr = 'Q' . $info->qtr;
    }
    $redzone = "";
    if ($info->qtr == 'Halftime') {
      $infostr = 'Half';
    } else {
      if ($info->down == 1) {
        $info->down = "1st";
      } else if ($info->down == 2) {
        $info->down = "2nd";
      } else if ($info->down == 3) {
        $info->down = "3rd";
      } else if ($info->down == 4) {
        $info->down = "4th";
      }
      if ($info->yl == 50) {
        $info->yl = "midfield";
      }
      $infostr = $info->qtr . " " . $info->clock . "<br>" . $info->down . " and " . $info->togo . " " . $info->yl;
      if (!empty($info->redzone)) {
        #$infostr = "<span color=red>$infostr</span>";
        $redzone = " redzone";
      }
    }
    $tr2 .= "<th class=\"infocell$redzone\" colspan=\"2\">$infostr</th>";
  } else {
    $tr2 .= "<th class=\"infocell\" colspan=\"2\">$Time</th>";
  }
#  print "<th class=\"awaycell\"><JJJa href=\"javascript:void(0);\" JJJonmouseover=\"return overlib('$Time');\" JJJonmouseout=\"return nd();\">$AwayHead</a></th><th class=\"homecell\"><JJJa href=\"javascript:void(0);\" JJJonmouseover=\"return overlib('$Time');\" JJJonmouseout=\"return nd();\">$HomeHead</a></th>\n";
  print "<th class=\"awaycell\">$AwayHead</th><th class=\"homecell\">$HomeHead</th>\n";
}
?>
<th nowrap class="awaycell">Total / Pot.</th>
</tr>
<?php 
$tr2 .= "<th class=\"infocellend\">&nbsp;&nbsp;</th></tr>\n";
print $tr2;
#  Get info on the pickers
$Sql = "SELECT pr.id, pr.nickname, s.score, s.numright, s.score + s.potscore as potscore2, s.numright + s.potright as potright2 FROM pickers pr, scores s WHERE pr.id = s.picker AND pr.active='y' AND s.week=$week and pr.year=$CurYear ";
if (isset($_SESSION['CurTag']) and $_SESSION['CurTag'] != 0) {
	$Sql .= " AND pr.id IN (SELECT pickerid FROM pickertags WHERE tagid = $_SESSION[CurTag])";
}
$Sql .= "ORDER BY potscore2 DESC, potright2 DESC";
$result = dbquery($Sql);

#  Loop through each picker
$Rank = 0;
foreach($result as $picker) {
  $Rank++;
  $Pid = $picker['id'];
  $Name = htmlentities($picker['nickname']);
  $TotalScore = $picker['score'];
  $TotalRight = $picker['numright'];
  #$PotScore = $TotalScore + $picker['potscore'];
  #$PotRight = $TotalRight + $picker['potright'];
  $PotScore = $picker['potscore2'];
  $PotRight = $picker['potright2'];
  if ($Pid == $_SESSION['id']) {
    $TrOpts = " class=\"myname\"";
  } else {
    $TrOpts = "";
  }
  print "<tr$TrOpts><td class=\"homecell\">$Rank</td><td class=\"homecell\" style=\"text-align: left;\">$Name</td>";

  #  Get their picks for this week
  $Sql = "SELECT p.guess, p.weight, p.game, g.home, g.away, g.winner FROM picks p, games g WHERE p.game = g.id and g.week = $week AND p.picker=$Pid";
  $picks = dbquery($Sql);
  # Store into different array, with the game id as the key
  $picks2 = array();
  foreach($picks as $pick) {
    $picks2[$pick['game']]['guess'] = $pick['guess'];
    $picks2[$pick['game']]['weight'] = $pick['weight'];
    $picks2[$pick['game']]['home'] = $pick['home'];
    $picks2[$pick['game']]['away'] = $pick['away'];
    $picks2[$pick['game']]['winner'] = $pick['winner'];
  }

  #  Loop through each game, printing out values as needed
  foreach ($games as $game) {
    $Gid = $game['gid'];
    $Winner = $game['winner'];
    if (isset($picks2[$Gid])) {
      $Val = $picks2[$Gid]['weight'];
      if (strlen ($Winner)) {
        if ($picks2[$Gid]['guess'] == $picks2[$Gid]['winner']) {
	  $pickclass='rightpick';
	} else {
	  $pickclass='wrongpick';
	}
      } else {
        $pickclass='maybepick';
     }
     if ($picks2[$Gid]['guess'] == $picks2[$Gid]['away']) {
       print "<td class=\"awaycell\"><span class=\"$pickclass\">$Val</span></td><td class=\"homecell\">&nbsp;</td>";
     } else {
       print "<td class=\"awaycell\">&nbsp;</td><td class=\"homecell\"><span class=\"$pickclass\">$Val</span></td>";
     }
    } else {
      print "<td class=\"awaycell\">-</td><td class=\"homecell\">-</td>";
    }
  }
  print "<td class=\"awaycell\" nowrap><span class=\"rightpick\">$TotalScore ($TotalRight)</span>";
  if ($TotalScore != $PotScore) {
    print "/ <span class=\"maybepick\">$PotScore</span>\n";
  }
  print "</td></tr>\n";
}
?>
</table>
