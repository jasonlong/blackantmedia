<?php
// ini_set('display_errors','1');
// error_reporting (E_ALL);

require($_SERVER['DOCUMENT_ROOT'].'/config/settings.php');
require('Akismet.class.php');
require('SMTP.class.php');

if(isset($_POST))
{
  $name = $_POST['name'];
  $email = $_POST['email'];
  $message = $_POST['message'];
  $ip = $_SERVER['REMOTE_ADDR'];

  $akismet = new Akismet($GLOBALS['DOMAIN'], $GLOBALS['AKISMET_API_KEY']);
  $akismet->setCommentAuthor($name);
  $akismet->setCommentAuthorEmail($email);
  $akismet->setCommentContent($message);
  $akismet->setUserIP($ip);

  send_mail( $name, $email, $ip, $akismet->isCommentSpam(), $message);
}

function send_mail( $name, $email, $ip, $is_spam, $message) {
  $subject = '';
  if( $is_spam == true )
    $subject = "[?]";
  $subject .= $GLOBALS['CONTACT_SUBJECT'];

  $smtp = new SMTP($GLOBALS['SMTP_SERVER'], $GLOBALS['SMTP_PORT']);
  $smtp->mail_from($email);
  $smtp->send($GLOBALS['CONTACT_RECIPIENT'], $subject, "Name: ".$name."\n\n".stripslashes($message));
}

?>
