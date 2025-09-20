<?php 
function PrintValues($NumVals, $Selected=0) {
  $ret =  "\n<OPTION VALUE=\"0\">Select Below</OPTION>";
  for ($i=1; $i <= $NumVals; $i++) {
    $ret .= "\n<OPTION VALUE=\"$i\" CLASS=\"opt$i\"";
    if ($i == $Selected) {
      $ret .= " SELECTED";
    }
    $ret .= ">$i</OPTION>";
  }
  return $ret;
}
?>
