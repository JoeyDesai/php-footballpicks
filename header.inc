<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<HTML>
<HEAD>
<meta name="viewport" content="width=device-width, initial-scale=1">
<TITLE><?php 
if (!isset($Title)) {
  print "No Title - Fix this!";
} else {
  print $Title;
}
?></TITLE>
<script type="text/javascript" src="overlib.js"><!-- overLIB (c) Erik Bosrup --></script>
<script type="text/javascript" src="jquery-1.7.1.min.js"></script>
<!-- <script type="text/javascript" src="jquery.dataTables.js"></script> -->
<script type="text/javascript">                                         
$(document).ready(function() {
   //$('.dTable').dataTable();
  $("tr").click(function() {
    $(this).toggleClass("highlight2");
  })
});
</script>         
<LINK REL=StyleSheet HREF="style.css?v=1.01" TYPE="text/css">
<?php if (isset($HeadOpts)) { print $HeadOpts; } ?>
</HEAD>
<BODY <?php if (isset($BodyOpts)) { print $BodyOpts; } ?>>
<div id="overDiv" style="position:absolute; visibility:hidden; z-index:1000;"></div>
<div class="heading">
Football Picks
</div>
<div class="heading-sep">
&nbsp;
</div>
<div class="main">

