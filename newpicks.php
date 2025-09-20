<?php
#$BodyOpts = "onLoad=\"UpdateValuesLeft()\"";
$Title = 'Jase the Ace Football Picks';
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

if (isset($_SESSION['su'])) {
  $Sql = "";
}

print "<div class=\"pgtitle\">Week $weeknum Picks for $SessName";
if ($factor != 1) {
  print "<br>For this week, all scores will be multiplied by $factor!";
}
print "</div>";

?>
    <div id="sortableContainer">
        <!-- Divs will be populated dynamically from the API data -->
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
    <script>
        $(document).ready(function() {
            // API URL to fetch JSON data
            const apiUrl = 'https://jasetheace.com/footballpicks/api/v1/picks/<?php print $weeknum;?>';
            updatable = true;

            // Function to populate sortable divs with data from the API
            function populateSortableDivs(data) {
                const $container = $('#sortableContainer');

                // Loop through the data and create sortable divs
                count = 0;
                total = data.length;
                data.forEach(item => {
                    count++;
                    if (item.aties != 0) {
                      adisplay = item.acity + " " + item.aname + " (" + item.awins + "-" + item.alosses + "-" + item.aties + ")";
                    } else {
                      adisplay = item.acity + " " + item.aname + " (" + item.awins + "-" + item.alosses + ")";
                    }
                    if (item.hties != 0) {
                      hdisplay = item.hcity + " " + item.hname + " (" + item.hwins + "-" + item.hlosses + "-" + item.hties + ")";
                    } else {
                      hdisplay = item.hcity + " " + item.hname + " (" + item.hwins + "-" + item.hlosses + ")";
                    }
                    if (item.aid == item.pick) {
                      ahighlight = 'highlighted';
                      hhighlight = '';
                    } else if (item.hid == item.pick) {
                      ahighlight = '';
                      hhighlight = 'highlighted';
                    } else {
                      ahighlight = '';
                      hhighlight = '';
                    }
                    if (item.pick == item.winner) {
                      weightclass = 'correct';
                    } else if (item.pick == item.loser) {
                      weightclass = 'incorrect';
                    } else {
                      weightclass = '';
                    }
                    const $div = $('<div>').addClass('sortableDiv').append(
                      "<div class=\"weight " + weightclass + "\">" + (total - count + 1) + "</div>" +
                      "<div class=\"game" + item.gid + " teampick " + ahighlight + "\">" +
                      "<img class=\"pickslogo\" src=\"/footballpicks/images/" + item.aname.toLowerCase() + ".svg\">" +
                      adisplay +
                      "</div>" +
                      "<div class=\"at\"> @ </div>" +
                      "<div class=\"game" + item.gid + " teampick " + hhighlight + "\">" +
                      "<img class=\"pickslogo\" src=\"/footballpicks/images/" + item.hname.toLowerCase() + ".svg\">" + " " +
                      hdisplay +
                      "</div>"
                      );
                    $container.append($div);
                });

                // Make the divs draggable and sortable
                if (updatable) {
                  $container.sortable({
                      start: function(event, ui) {
                          ui.item.addClass('dragging');
                      },
                      stop: function(event, ui) {
                          ui.item.removeClass('dragging');
                      },
                      update: function(event, ui) {
                          // Callback function for order change
                          handleOrderChange();
                      },
                      //handle: ".weight",
                      helper: 'clone',
                  });
                  $container.disableSelection();
                }
            }

            function handleOrderChange() {
                total = $('#sortableContainer .sortableDiv').length;
                $('#sortableContainer .sortableDiv').each(function(index,element) {
                  $(element).children().first().text(total - index);
                  // Get the game id
                  // Get the winner
                  // Get the value
                  // Store them in a json object
                  
                });
                // Use the API to store the picks
            }

            // Make the API call to fetch data and populate the divs
            $.ajax({
                url: apiUrl,
                method: 'GET',
                dataType: 'json',
                success: function(data) {
                    if (data.canUpdate == 0) {
                      updatable = false;
                      //$('#sortableContainer').sortable('option','disabled');
                    }
                    populateSortableDivs(data.picks);
                },
                error: function(error) {
                    console.error('Error fetching data from the API:', error);
                }
            });

            $("#sortableContainer").on('click','.teampick',function() {
              if (updatable) {
                //$(this).toggleClass("highlighted");
                $(this).parent().children().removeClass("highlighted");
                $(this).addClass("highlighted");
              }
            });
        });
    </script>
<?php
include 'footer.inc';
?>
