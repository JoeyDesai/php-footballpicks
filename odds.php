<?php 
$Title = 'Odds';
$NoLogin = 1;
require_once 'common.inc';

error_reporting(E_ALL);

$url = "https://sports.yahoo.com/nfl/scoreboard/";
$ch = curl_init();
curl_setopt($ch,CURLOPT_URL,$url);
curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,5);
$content = curl_exec($ch);
curl_close($ch);
if (preg_match("/root.App.main = (.*);/",$content,$Regs)) {
  $data_txt = $Regs[1];
} else {
  die("Could not get data\n");
}
$data = json_decode($data_txt);


#var_dump($data->context->dispatcher->stores->GamesStore->games);
#var_dump($data->context->dispatcher->stores->GamesStore->games->{'nfl.g.20230924030'});
#var_dump($data->context->dispatcher->stores->TeamsStore->teams);

$teams = array();

foreach ($data->context->dispatcher->stores->TeamsStore->teams as $key => $val) {
  if (!preg_match('/nfl/',$key)) {
    continue;
  }
  if (!empty($data->context->dispatcher->stores->TeamsStore->teams->$key->abbr)) {
    $abbr = $data->context->dispatcher->stores->TeamsStore->teams->$key->abbr;
    #print "\n<br />$key -> $abbr ";
    $teams[$key] = $abbr;
    $teams[$abbr] = $key;
  }
}

$odds = array();

foreach ($data->context->dispatcher->stores->GamesStore->games as $game => $val) {
  if (!preg_match('/nfl/',$val->home_team_id)) {
    continue;
  }

  $home = $teams[$val->home_team_id];
  $home_spread = $val->odds->{'101'}->home_spread;
  $away = $teams[$val->away_team_id];
  $away_spread = $val->odds->{'101'}->away_spread;

  $game_str = "$away @ $home";

  foreach($val->odds as $odd) {
    $odds[$odd->book_name][$game_str]['home'] = $home;
    $odds[$odd->book_name][$game_str]['away'] = $away;
    $odds[$odd->book_name][$game_str]['home_spread'] = $home_spread;
    $odds[$odd->book_name][$game_str]['away_spread'] = $away_spread;
    $odds[$odd->book_name][$game_str]['spread'] = abs($away_spread);

    #var_dump($odds);
  }

}
function my_cmp($a, $b) {
  if ($a['spread'] == $b['spread']) {
    return ($a['home'] < $b['home']) ? -1 : 1;
  }
  return ($a['spread'] < $b['spread']) ? 1 : -1;
}
foreach ($odds as $org => $games) {
  #var_dump($val);
  print "\n<div class=\"org_container\">";
  print "\n<div class=\"org\">$org</div>";
  usort($games,"my_cmp");
  $count = 0;
  $numgames = count($games);
  foreach ($games as $game_str => $game) {
    #var_dump($game); exit;
    $home = $game['home'];
    $away = $game['away'];
    $home_spread = $game['home_spread'];
    $away_spread = $game['away_spread'];
    print "\n<div class=\"game_odds";
    if ($count%2 == 0) {
      print " row_even";
    } else {
      print " row_odd";
    }
    $count++;
    print "\"><div class=\"num\">$numgames</div><div class=\"team away";
    if ($away_spread < 0) {
      print " should_win";
    }
    print "\">$away ($away_spread)</div> <div class=\"at\">@</div> <div class=\"team home";
    if ($home_spread < 0) {
      print " should_win";
    }
    print "\">$home ($home_spread)</div></div>";
    $numgames--;
  }
  print "\n</div> <!-- org_container -->";

}

include 'footer.inc';
