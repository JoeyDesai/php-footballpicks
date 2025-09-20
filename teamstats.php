<?php
$Title = 'Jase the Ace Football Picks';
$HeadOpts = "<script type=\"text/javascript\" src=\"sorttable.js\"></script>";
#$NoWeekNav = 1;
require_once 'common.inc';
require_once 'teamstats.inc';
?>
<H3>Interesting Team Pick Stats</H3>
<?php

show_teamstats();

include 'footer.inc';
?>
