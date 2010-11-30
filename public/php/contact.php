<?php
require('Akismet.class.php');
require('SMTP.class.php');

if(isset($_POST))
{
  $wp_key = "fa2e40d6b4a4";
  $our_url = 'http://blackant';

  $name = $_POST['name'];
  $email = $_POST['email'];
  $message = $_POST['message'];
  $ip = $_SERVER['REMOTE_ADDR'];

  $akismet = new Akismet($our_url, $wp_key);
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
  $subject .= "[Black Ant] Contact form message";

  // mail( "jason@blackantmedia.com", $subject, $author_name.", ".$author_email."\r\n\r\n".$message);
  $smtp = new SMTP("smtp-server.columbus.rr.com", 25);
  // $smtp->auth(SMTP_USER, SMTP_PASS);
  $smtp->mail_from($email);
  $smtp->send("jason@blackantmedia.com", $subject, "Name: ".$name."\n\n".$message);
}

?>
