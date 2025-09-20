<?php 
$Sql = "SELECT id, number FROM weeks WHERE year=$CurYear ORDER BY startdate";
$result = dbquery($Sql);
?>
<div class="weeknav">
<table class="weeknav" width=100%>
<tr>
<td><a class="weeknav" href="./">Home</a></td>
<td>
<?php 
if (!isset($NoWeekNav)) {
  if (!isset($WeekNavScript)) {
    $WeekNavScript = "picks.php";
  }
  
  foreach ($result as $row) {
    $num = $row['number'];
    $id = $row['id'];
    print "<a class=\"weeknav\" href=\"$WeekNavScript?week=$id\">$num</a> &nbsp;\n";
  }
}
?>
</td>
<td><a class="weeknav" href="logout.php">Logout</a></td>
</tr>
</table>
</div>
<?php
if (!isset($NoTags)) {
if (isset($_SESSION['Tags']) and count($_SESSION['Tags']) > 0) {
?>
  <div class="tagbar">
  <ul>
<?php foreach ($_SESSION['Tags'] as $id => $name): 
    if ($id == $_SESSION['CurTag']) {
      $CurClass = " class=\"active\"";
    } else {
      $CurClass = "";
    }
?>
    <li <?= $CurClass ?>>
        <form method="POST" action="filter.php" style="display:inline;">
            <input type="hidden" name="tagid" value="<?= $id ?>">
            <button type="submit" style="border:none;cursor:pointer;" <?= $CurClass ?>>
                <?= htmlspecialchars($name) ?>
            </button>
        </form>
    </li>
<?php endforeach; ?>
</ul>
</div>
<?php
}
}