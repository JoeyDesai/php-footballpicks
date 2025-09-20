<?php
$BodyOpts = "onLoad=\"UpdateValuesLeft()\"";
$Title = 'Jase the Ace Football Picks';
$NoTags = 1;
require_once 'common.inc';

if (!isset($_REQUEST['week'])) {
  die("Error 1!");
}
$week = $_REQUEST['week'];
#if (isnum($_POST['week'])) {
#  $week = $_POST['week'];
#} else if (isnum($_GET['week'])) {
#  $week = $_GET['week'];
#}
check_num($week);

#  Get info on the week
$Sql = "SELECT number, startdate < now() as old, factor FROM weeks WHERE id=$week";
$result = dbquery($Sql);
$weeknum = $result[0]['number'];
#print "VALUE = " . $result[0]['old'];
if ($result[0]['old'] == 't') {
  $ReadOnly=1;
} else {
  $ReadOnly=0;
}
$factor = $result[0]['factor'];
#  If needed to update things
#if ($_SESSION['Email'] == 'james') {
#  $ReadOnly=0;
#}
if (isset($_SESSION['su'])) {
  $ReadOnly=0;
}

if (isset($_POST['Submit'])) {

  unset($_SESSION['Error']);

  #print "Inserting ...";

  #  Make sure we're not trying to edit a week that has already started
  if ($ReadOnly) {
    print "Error - it is too late to do/change your picks now - the week has already started!";
    include 'footer.inc';
  }

  #  Get games, verifying input
  $Sql = "SELECT id, home, away FROM games WHERE week=$week";
  $result = dbquery($Sql);
  $NumGames = count($result);
  $Error = 0;
  foreach ($result as $games) {
    $id = $games['id'];

    #  Store the input
    $Winner[$id] = $_POST["GAME$id"];
    $Value[$id] = $_POST["VAL$id"];

    #  Check for valid input
    #  Verify that there are no point dupes or 0's
    if (isset($Points[$Value[$id]]) or $Value[$id]==0 or !isnum($_POST["GAME$id"]) or !isnum($_POST["VAL$id"])) {
      $Error=1;
      $ErrStr = "Error - Either you have not selected a winner, or not selected a value for each game, or you have two games with the same value!";
      print "\n<!-- DEBUG - Found error for id $id -->\n";
      $ErrorWeeks[$id]=1;
      if (isset($Points[$Value[$id]])) {
        $ErrorWeeks[$Points[$Value[$id]]] = 1;
      }
    }
    #  Store that this point value has been used
    $Points[$Value[$id]]=$id;

  }

  #  Check if there was an error
  if ($Error) {
    $UnusedPoints = "";
    for ($i=1; $i <= $NumGames; $i++) {
      if (!isset($Points[$i])) {
        $UnusedPoints .= " $i ";
      }
    }
    #  Store values in Session
    $_SESSION['Winner'] = $Winner;
    $_SESSION['Value'] = $Value;
    $_SESSION['Error'] = $ErrStr;
    $_SESSION['ErrorWeeks'] = $ErrorWeeks;
    $_SESSION['Unused'] = $UnusedPoints;
    print $ErrStr;
    print "<p>Please <a href=\"".htmlentities($_SERVER['PHP_SELF'])."?week=$week\">try again</a></p>.";
    include 'footer.inc';
  }

  #  Insert values into database
  foreach ($result as $games) {
    $id = $games['id'];
    $Sql = "SELECT id FROM picks WHERE picker=$SessId AND game=$id";
    $result = dbquery($Sql);
    if (count($result) > 0) {
      $Sql = "UPDATE picks SET guess=".$Winner[$id].", weight=".$Value[$id]." WHERE id=".$result[0]['id'];
    } else {
      $Sql = "INSERT INTO picks (picker, game, guess, weight) values ($SessId, $id, ".$Winner[$id].", ".$Value[$id].")";
    }
    dbquery($Sql);
  }

  #  Remove values from session
  unset($_SESSION['Winner']);
  unset($_SESSION['Value']);
  $_SESSION['Error']="";
  unset($_SESSION['Error']);
  unset($_SESSION['ErrorWeeks']);
  unset($_SESSION['Unused']);

  print "<br><br><div class=\"attention\">Picks saved!</div>";
  include 'footer.inc';

}

if (isset($_SESSION['su'])) {
  $Sql = "";
}

print "<div class=\"pgtitle\">Week $weeknum Picks for $SessName";
if ($factor != 1) {
  print "<br>For this week, all scores will be multiplied by $factor!";
}
print "</div>";


if (!isset($_SESSION['Error']) or $_SESSION['Error'] == "") {
  #  Get any existing picks and values from the database
  $Sql = "SELECT guess, weight, game FROM picks p, games g WHERE
    p.picker=$SessId AND
    p.game=g.id AND
    g.week=$week
  ";
  $result = dbquery($Sql);
  foreach ($result as $row) {
    $Winner[$row['game']] = $row['guess'];
    $Value[$row['game']] = $row['weight'];
  }
} else {
  $Winner = $_SESSION['Winner'];
  $Value = $_SESSION['Value'];
  print "\n<div class=\"attention\">" . $_SESSION['Error'] . "</div>";
  #if (strlen($_SESSION['Unused'])) {
    #print "<p>(Unused values: " .$_SESSION['Unused'].")</p>";
  #}
}
if (!$ReadOnly) {
  print "<input type=\"checkbox\" name=\"autovalue\" id=\"autovalue\" checked /> Auto pick highest value<br /><div id=\"picksremaining\" class=\"picksremaining\">Unused Values:</div>";
}
#  Get list of games
$Sql = "SELECT g.id as gid, h.city as hcity, h.name as hname, h.id as hid, a.city as acity, a.name as aname, a.id as aid, g.date, g.winner, h.wins as hwins, h.losses as hlosses, h.ties as hties, a.wins as awins, a.losses as alosses, a.ties as aties
  FROM games g, teams h, teams a 
  WHERE g.home = h.id AND
  g.away = a.id AND
  g.week = $week
  ORDER BY g.date, a.city
";

$result = dbquery($Sql);
require_once "values.inc";
if (!$ReadOnly) {
?>
<SCRIPT type="text/javascript">
function UpdateValuesLeft(rownum) {
  var count=0;
  for (var i=0; i < document.forms['picks'].elements.length; i++) {
    if (document.forms['picks'].elements[i].type == 'select-one') {
      count++;
    }
  }
  var picksused = new Array(count+1);
  var problemrows = new Array(count+1);
  for (i=0; i<=count; i++) {
    picksused[i]=0;
    problemrows[i]=0;
  }

  for (var i=1; i <= count; i++) {
    var sel = document.getElementById('sel' + i);
    var val = sel.options[sel.selectedIndex].value;
    if (val == 0) {
      problemrows[i] = 1;
    } else if (picksused[val] != 0) {
      problemrows[i] = 1;
      problemrows[picksused[val]] = 1;
    } else {
      picksused[val] = i;
    }
  }

  if (rownum > 0) {
    var auto = document.getElementById('autovalue');
    if (auto.checked) {
      sel = document.getElementById('sel' + rownum);
      if (sel.selectedIndex == 0) {
        for (i=count; i>0; i--) {
          if (picksused[i] == 0) {
            break;
          }
        }
        sel.selectedIndex = i;
        problemrows[rownum] = 0;
        picksused[i] = 1;
      }
    }
  }

  var unused = '';
  var dupes = '';
  var opts = '';
  for (var i=1; i <= count; i++) {
    if (picksused[i] == 0) {
      unused = unused + ' ' + i;
    //  problemrows[i] = 1;
    //} else if (picksused[i] > 1) {
    //  dupes = dupes + ' ' + i;
    //  problemrows[i] = 1;
      opts = document.getElementsByClassName('opt' + i);
      for (var j=0; j<opts.length; j++) {
        opts[j].style.color='black';
        //opts[j].style.fontStyle='normal';
      }
    } else {
      opts = document.getElementsByClassName('opt' + i);
      for (var j=0; j<opts.length; j++) {
        opts[j].style.color='red';
        //opts[j].style.fontStyle='italic';
      }
    }
    var arad = document.getElementById('arad'+i);
    var hrad = document.getElementById('hrad'+i);
    if (!(arad.checked || hrad.checked)) {
      //alert('It appears that there is no check for row ' + i);
      problemrows[i] = 1;
    }
  }

  var picktext = document.getElementById('picksremaining');
  //picktext.innerHTML='Unused Values:' + unused + '<br>Duplicate Values:' + dupes;
  picktext.innerHTML='Unused Values:' + unused; 

  var Errors = false;
  for (i=1; i<=count; i++) {
    var row = document.getElementById('row'+i);
    if (problemrows[i] != 0) {
      //alert('Alerting for row ' + i);
      row.className = 'attention';
      Errors = true;
    } else {
      //alert ('Row ' + i + ' is normal.');
      row.className = 'normal';
    }
  }

  return Errors;
}
function CheckValues() {
  if (UpdateValuesLeft()) {
    alert("There are errors in your picks - please fix them before submitting.");
    return false;
  }
  return true;
}
</SCRIPT>
<FORM NAME=picks METHOD="POST" onSubmit="return CheckValues();">
<INPUT TYPE="HIDDEN" NAME="week" VALUE="<?php print $week; ?>">
<?php
}
?>
<table class="picks">
<tr><th>Away</th><th>&nbsp;</th><th>&nbsp;</th><th>&nbsp;</th><th>Home</th><th>&nbsp;</th><th>Value</th></tr>
<?php
$TotalValue=0;
$TotalMaybe=0;
$NumTotalValue=0;
$NumTotalMaybe=0;
$Count = 0;
foreach ($result as $row) {
  $Count++;
  $gid=$row['gid'];
  if (!isset($Value[$gid])) {
    $Val = 0;
  } else {
    $Val = $Value[$gid];
  }
  if (!isset($Winner[$gid])) {
    $Win = 0;
  } else {
    $Win = $Winner[$gid];
  }
  $tr_opts = "";
  $Aid = $row['aid'];
  $Hid = $row['hid'];
  $AChecked = "";
  $HChecked = "";
  $ROAChecked = "&nbsp;";
  $ROHChecked = "&nbsp;";
  if ($Win == $Aid) {
    $AChecked = "CHECKED";
    $ROAChecked = "&nbsp; X &nbsp;";
  } else if ($Win == $Hid) {
    $HChecked = "CHECKED";
    $ROHChecked = "&nbsp; X &nbsp;";
  } else {
    $tr_opts = "class=\"attention\"";
  }
  $Away = $row['acity']." ".$row['aname']." (".$row['awins']."-".$row['alosses'];
  if ($row['aties'] > 0) {
    $Away .= "-" . $row['aties'];
  }
  $Away .= ")";
  #$Away .= " <div class=\"pickslogo\" style=\"background-image: url(/footballpicks/images/".strtolower($row['aname']).".svg);\">&nbsp;</div>";
  $Away .= " <img class=\"pickslogo\" src=\"/footballpicks/images/".strtolower($row['aname']).".svg\">";
  $Home = "<img class=\"pickslogo\" src=\"/footballpicks/images/".strtolower($row['hname']).".svg\"> ";
  $Home .= $row['hcity']." ".$row['hname']." (".$row['hwins']."-".$row['hlosses'];
  if ($row['hties'] > 0) {
    $Home .= "-" . $row['hties'];
  }
  $Home .= ")";
  if (isset($_SESSION['ErrorWeeks'][$gid])) {
    #$tr_opts = "bgcolor='#FF7777'";
    $tr_opts = "class=\"attention\"";
  }
  if ($ReadOnly) {
    $Val = $Value[$row['gid']];
    $ACheck = $ROAChecked;
    $HCheck = $ROHChecked;
    $RealWinner = $row['winner'];
    if (isset($RealWinner)) {
      if ($RealWinner == $Win) {
        $ValClass='rightpick';
        $TotalValue += $Val;
	$NumTotalValue++;
      } else {
        $ValClass='wrongpick';
      }
    } else {
      $ValClass='maybepick';
      $TotalMaybe += $Val;
      $NumTotalMaybe++;
    }
  } else {
    $ACheck = "<INPUT ID=\"arad$Count\" TYPE=RADIO NAME=\"GAME$gid\" VALUE=\"$Aid\" onChange=\"UpdateValuesLeft($Count)\" $AChecked>";
    $HCheck= "<INPUT ID=\"hrad$Count\" TYPE=RADIO NAME=\"GAME$gid\" VALUE=\"$Hid\" onChange=\"UpdateValuesLeft($Count)\" $HChecked>";
    $v = "";
    if (isset($Value[$row['gid']])) {
      $v = $Value[$row['gid']];
    }
    $Val = "<SELECT ID=\"sel$Count\" NAME=VAL$gid onChange=\"UpdateValuesLeft(0)\">" . PrintValues(count($result), $v) . "\n</SELECT>";
    $ValClass='normal';
  }

  print "\n<tr id=\"row$Count\" $tr_opts>
  <TD align=\"right\">$Away</TD>
  <TD>$ACheck</TD>
  <TD>&nbsp;</TD>
  <TD>$HCheck</TD>
  <TD>$Home</TD>
  <TD>&nbsp;</TD>
  <TD align=center class=\"$ValClass\">$Val</TD>
  </TR>";
}
if ($ReadOnly) {
  print "\n<tr>
  <TD COLSPAN=7 ALIGN=center>Correct: <b><font color=blue>$TotalValue ($NumTotalValue)</font></b>.";
  if ($TotalMaybe != 0) {
    #$TotalMaybe += $TotalValue;
    print " &nbsp; &nbsp; Additional Potential: <font color=green>$TotalMaybe ($NumTotalMaybe)</font>.";
  }
  print "</TD>
  </TR>";
}
?>
</table>
<?php 
if (!$ReadOnly) {
?>
<INPUT TYPE=SUBMIT NAME=Submit VALUE=Submit>
</FORM>
<?php 
}
include 'footer.inc';
?>
