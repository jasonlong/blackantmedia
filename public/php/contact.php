<?php
date_default_timezone_set('US/Eastern');

require($_SERVER['DOCUMENT_ROOT'].'/config/settings.php');
require('Akismet.class.php');
require('SMTP.class.php');

if(isset($_POST)) {
  $name = $_POST['name'];
  $email = $_POST['email'];
  $message = $_POST['message'];
  $ip = $_SERVER['REMOTE_ADDR'];

  $akismet = new Akismet($GLOBALS['DOMAIN'], $GLOBALS['AKISMET_API_KEY']);
  $akismet->setCommentAuthor($name);
  $akismet->setCommentAuthorEmail($email);
  $akismet->setCommentContent($message);
  $akismet->setUserIP($ip);

  if (send_mail( $name, $email, $ip, $akismet->isCommentSpam(), $message)) {
    $status = array('code' => '1');
  }
  else {
    $status = array('code' => '0');
  }
  echo json_encode($status);
}

function send_mail( $name, $email, $ip, $is_spam, $message) {
  $subject = '';
  if( $is_spam == true )
    $subject = "[?]";
  $subject .= $GLOBALS['CONTACT_SUBJECT'];

  $smtp = new SMTP($GLOBALS['SMTP_SERVER'], $GLOBALS['SMTP_PORT']);
  $smtp->mail_from($email);
  return $smtp->send($GLOBALS['CONTACT_RECIPIENT'], $subject, "Name: ".$name."\n\n".stripslashes($message));
}
?>
