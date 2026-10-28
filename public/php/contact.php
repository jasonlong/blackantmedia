<?php
date_default_timezone_set('US/Eastern');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Allow: POST');
  http_response_code(405);
  echo json_encode(array('code' => '0'));
  exit;
}

foreach (array('name', 'email', 'message') as $field) {
  if (!isset($_POST[$field]) || !is_string($_POST[$field]) || trim($_POST[$field]) === '') {
    http_response_code(400);
    echo json_encode(array('code' => '0'));
    exit;
  }
}
if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(array('code' => '0'));
  exit;
}

require($_SERVER['DOCUMENT_ROOT'].'/config/settings.php');

// The Fly image has an empty settings file until mail is configured.
foreach (array('DOMAIN', 'AKISMET_API_KEY', 'CONTACT_SUBJECT', 'CONTACT_RECIPIENT', 'SMTP_SERVER', 'SMTP_PORT') as $setting) {
  if (empty($GLOBALS[$setting])) {
    http_response_code(503);
    echo json_encode(array('code' => '0'));
    exit;
  }
}

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
  if( $is_spam == false && empty($name) == false && empty($email) == false ) {
    $subject = $GLOBALS['CONTACT_SUBJECT'];

    $smtp = new SMTP($GLOBALS['SMTP_SERVER'], $GLOBALS['SMTP_PORT']);
    $smtp->mail_from($email);
    return $smtp->send($GLOBALS['CONTACT_RECIPIENT'], $subject, "Name: ".$name."\n\n".stripslashes($message));
  }
  else return true;
}
?>
