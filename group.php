<?php
$Title = 'Group Stats';
$WeekNavScript = 'group.php';
$HeadOpts = "<script type=\"text/javascript\" src=\"sorttable.js\"></script>
<!-- <link rel=\"stylesheet\" <link rel=\"stylesheet\" href=\"https://use.fontawesome.com/releases/v5.3.1/css/all.css\" integrity=\"sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU\" crossorigin=\"anonymous\"> -->
";
require_once 'common.inc';

?>
<input type="checkbox" onclick="toggleAutoRefresh(this);" id="reloadCB"> Auto Refresh
<script>
var reloading;

function checkReloading() {
    if (window.location.hash=="#autoreload") {
        reloading=setTimeout("window.location.reload();", 60000);
        document.getElementById("reloadCB").checked=true;
    }
}

function toggleAutoRefresh(cb) {
    if (cb.checked) {
        window.location.replace("#autoreload");
        reloading=setTimeout("window.location.reload();", 60000);
    } else {
        window.location.replace("#");
        clearTimeout(reloading);
    }
}

window.onload=checkReloading;
</script>
<?php
$week = 0;
if (isset($_GET['week'])) {
  if (isnum($_GET['week'])) {
    $week = $_GET['week'];
  }
}

if ($week) {
  #  Get info on the week
  $Sql = "SELECT number, startdate < now() as old FROM weeks WHERE id=$week";
  $result = dbquery($Sql);
  $weeknum = $result[0]['number'];
  if ($result[0]['old'] == 't') {
    $ReadOnly=1;
  } else {
    print "<div class=\"pgtitle\">Week $weeknum Group Stats</div>";
    print "<br><div class=\"attention\">No data available yet</div>";
    include 'footer.inc';
    exit;
  }
}

if ($week) {
  #  Get Week Stats
  include "weekstats.inc";

} else {
  #  Overall Stats
  include "overallstats.inc";
}

include 'footer.inc';
?>
