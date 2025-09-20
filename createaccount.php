<?php
$NoLogin=1;
$Title = 'Create Account';
$SitePass='cowboys';
require_once 'common.inc';

#  Check data if submitted
if (isset($_POST['SUBMIT'])) {
  $Error = 0;
  $PassErr = 0;
  $ErrMsg = "";
  if (preg_match("/^[[:space:]]*$/", $_POST['email'])) {
    $Error=1;
    $ErrMsg .= "<li>You must provide an email address</li>";
  }
  if (preg_match("/^[[:space:]]*$/", $_POST['name'])) {
    $Error=1;
    $ErrMsg .= "<li>You must provide your real name</li>";
  }
  if (preg_match("/^[[:space:]]*$/", $_POST['nick'])) {
    $Error=1;
    $ErrMsg .= "<li>You must provide your nick name</li>";
  }
  if (preg_match("/^[[:space:]]*$/", $_POST['pass1'])) {
    $Error=1;
    $PassErr = 1;
    $ErrMsg .= "<li>You must provide a password</li>";
  }
  if (preg_match("/^[[:space:]]*$/", $_POST['pass2'])) {
    $Error=1;
    $PassErr = 1;
    $ErrMsg .= "<li>You must retype your password</li>";
  }
  if (!$PassErr) {
    if ($_POST['pass1'] != $_POST['pass2']) {
      $Error = 1;
      $ErrMsg .= "<li>Your passwords do not match</li>";
    }
  }
  if (preg_match("/^[[:space:]]*$/", $_POST['sitepass'])) {
    $Error=1;
    $ErrMsg .= "<li>You must provide the site password</li>";
  } else if ($_POST['sitepass'] != $SitePass) {
    $Error=1;
    $ErrMsg .= "<li>Invalid site password!</li>";
  }

  #  Check if the email address was already used
  $email = pg_escape_string($_POST['email']);
  $Sql = "SELECT email FROM pickers WHERE email='$email' and year=$CurYear";
  $result = dbquery($Sql);
  if (count($result)) {
    $Error=1;
    $ErrMsg .= "<li>Email address was already used</li>";
  }

  if (!$Error) {
    #  Insert the data
    $pass1 = pg_escape_string($_POST['pass1']);
    $nick = pg_escape_string($_POST['nick']);
    $name = pg_escape_string($_POST['name']);
    $Sql = "INSERT INTO pickers (email, password, nickname, realname, year) VALUES ('$email', '$pass1', '$nick', '$name', $CurYear)";
    dbquery($Sql);
    print "Account created - please <a href=\"./\">log in</a>";
    mail("jase@jasetheace.com","New Picks Account Created", "New Picks account created:\n\nName: $name\nEmail: $email\nNickName: $nick\n");
    include 'footer.inc';
    exit;
  }
}
if (isset($Error)) {
  print "<div class=\"attention\"><ul>$ErrMsg</ul></div>";
}
?>
<div class=pgtitle>
Please provide the following information:
</div>
<FORM METHOD=POST ACTION="">
<table>
<tr><td>Email Address:</td><td><INPUT NAME=email VALUE="<?php print htmlentities(stripslashes($_POST['email'])); ?>"></td><td>(Your email address)</td></tr>
<tr><td>Real Name:</td><td><INPUT NAME=name VALUE="<?php print htmlentities(stripslashes($_POST['name'])); ?>"></td><td>(Your name)</td></tr>
<tr><td>Nick Name:</td><td><INPUT NAME=nick VALUE="<?php print htmlentities(stripslashes($_POST['nick'])); ?>"></td><td>(Your nick name)</td></tr>
<tr><td>Password:</td><td><INPUT NAME=pass1 TYPE=PASSWORD VALUE="<?php print htmlentities(stripslashes($_POST['pass1'])); ?>"></td><td>(The password you'd like to use for this site)</td></tr>
<tr><td>Retype Password:</td><td><INPUT NAME=pass2 TYPE=PASSWORD VALUE="<?php print htmlentities(stripslashes($_POST['pass2'])); ?>"></td><td>(Retype the above password)</td></tr>
<tr><td>Site Password:</td><td><INPUT NAME=sitepass TYPE=PASSWORD VALUE="<?php print htmlentities(stripslashes($_POST['sitepass'])); ?>"></td><td>(The sign-up password given to you)</td></tr>
<tr><td>&nbsp;</td><td><INPUT TYPE=SUBMIT NAME=SUBMIT VALUE="Sign Up"></td></tr>
</table>
</FORM>
<?php
  
include 'footer.inc';
?>
