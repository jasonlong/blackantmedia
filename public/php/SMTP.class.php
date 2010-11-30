<?php
#
# Class: SMTP
# Author: aldo of http://mschat.net/
#
# This class can be used to send email with SMTP instead of mail().
#
# Here is an example of how to use it:
#
# require('SMTP.class.php');
# $smtp = new SMTP(SMTP_HOST, SMTP_PORT, IS_TLS);
# $smtp->auth(SMTP_USER, SMTP_PASS);
# $smtp->mail_from(WHO_IS_THE_EMAIL_FROM);
# $smtp->send(TO, SUBJECT, MESSAGE, ADDITIONAL_HEADERS);
#
# Of course replacing everything with the necessary stuff.
#
# NOTE: This WILL work with GMail! Use ssl://smtp.gmail.com for the SMTP host
#       and 465 as the SMTP port, and false for TLS.
#
# This script is released under the Lesser GPL. You are allowed to
# use this in, well, anything really. You can redistribute it, edit it
# and so on. All I ask is you give credit where credit is due.
#

class SMTP
{
  private $con = null;
  private $smtp_host = null;
  private $smtp_port = null;
  private $is_tls = false;
  private $tryfor = 5;
  private $errors = array();
  private $mail_from = null;
  private $charset = 'UTF-8';
  private $is_html = false;
  private $priority = 'normal';

  #
  # __construct([string $smtp_host = null[, int $smtp_port = 25[, bool $is_tls = false[, int $tryfor = 5]]]]);
  #   string $smtp_host - The address to the SMTP host, like mail.example.com
  #   int $smtp_port - The port the SMTP server is listening on, usually 25,
  #                    but not always! (So, of course, defaults to 25)
  #   bool $is_tls - Whether or not to initiate a TLS connection with the server.
  #                  Not always supported, but after you connect, you can check if
  #                  the connection accepted it with the method is_tls().
  #   int $tryfor - How many seconds that should be given to connect to the SMTP
  #                 server and how long should be given for execution of an fread.
  #
  public function __construct($smtp_host = null, $smtp_port = 25, $is_tls = false, $tryfor = 5)
  {
    if(!empty($smtp_host))
      $this->connect($smtp_host, $smtp_port, $is_tls, $tryfor);
  }

  #
  # Connects to the SMTP Server.
  #
  # bool connect(string $smtp_host[, int $smtp_port[, bool $is_tls = false[, int $tryfor = 5]]]);
  #   For more information, look at __construct() above.
  #
  # returns bool - If the connection was made, TRUE is issued, otherwise FALSE.
  #
  public function connect($smtp_host, $smtp_port = 25, $is_tls = false, $tryfor = 5)
  {
    if(!empty($this->con))
    {
      # Already connected!
      $this->errors[] = 'Already connected to the SMTP server '. htmlspecialchars($this->smtp_host). '.';
      return false;
    }

    # Try connecting :)
    $this->con = fsockopen($smtp_host, $smtp_port, $errno, $errstr, $tryfor);

    # Did we connect?
    if(!empty($this->con))
    {
      # Set stream blocking...
      @stream_set_blocking($this->con, 1);
      @stream_set_timeout($this->con, $tryfor, 0);

      # Clear the buffer...
      $this->get_response();

      # Now we may initiate TLS if you want...
      if(!empty($is_tls))
        $this->is_tls = $this->init_tls();

      $this->smtp_host = $smtp_host;
      $this->smtp_port = (int)$smtp_port;
      $this->tryfor = (int)$tryfor;

      # HELLO MR SERVER! CAN YOU HEAR ME?
      if(!$this->send_hello())
      {
        # Oh noes! Something went wrong o.O
        $this->errors[] = 'Server refused HELO.';
        $this->close();
        return false;
      }

      return true;
    }
    else
    {
      $this->errors[] = 'The server '. htmlspecialchars($smtp_host). ' refused connection.';
      return false;
    }
  }

  #
  # Retrieves the response from the SMTP server.
  #
  # mixed get_response();
  #
  # returns mixed - A String containing the response will be returned if there
  #                 was one, but if none (Like your not connected) FALSE is issued.
  #
  private function get_response()
  {
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot get a response.';
      return false;
    }

    @stream_set_timeout($this->con, $this->tryfor);
    $meta = stream_get_meta_data($this->con);

    $response = '';
    while($data = @fgets($this->con, 512))
    {
      $response .= $data;

      # Done reading?
      if(substr($data, 3, 1) == ' ')
        break;
    }

    return !empty($response) ? $response : false;
  }

  #
  # Initiates a TLS connection with the SMTP Server.
  #
  # bool init_tls();
  #
  # returns bool - If TLS was accepted by the server, TRUE is returned. Otherwise FALSE.
  #
  private function init_tls()
  {
    # Gotta be connected :P
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot send a TLS request.';
      return false;
    }

    # Ask Mr. Server very nicely :)
    fwrite($this->con, "STARTTLS\r\n");

    $reply_code = (int)substr($this->get_response(), 0, 3);

    # It will return 220 if it was accepted.
    if($code == 220)
      # Now turn on encryption support for this connection for TLS.
      return @stream_socket_enable_crypto($this->con, true, STREAM_CRYPTO_METHOD_TLS_SERVER);
    else
    {
      $this->errors[] = 'TLS was not accepted by the server '. htmlspecialchars($this->smtp_host). '.';
      return false;
    }
  }

  #
  # Sends EHLO or HELO if EHLO is not supported by the server.
  #
  # bool send_hello();
  #
  # returns bool - If it was successfully recieved by the SMTP Server, TRUE is issued. Otherwise FALSE.
  #
  private function send_hello()
  {
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot send a HELO.';
      return false;
    }

    # EHLO might not always work. If it doesn't, the server will just say no ;)
    fwrite($this->con, "EHLO {$this->smtp_host}\r\n");

    $reply_code = substr($this->get_response(), 0, 3);

    # A reply of 250 is good, otherwise, it isn't :(
    if($reply_code == 250)
      return true;
    else
    {
      # Just try HELO...
      fwrite($this->con, "HELO {$this->smtp_host}\r\n");

      # Get this reply code :)
      $reply_code = substr($this->get_response(), 0, 3);

      # Return if it worked XD.
      return $reply_code == 250;
    }
  }

  #
  # Authenticates with the SMTP server.
  #
  # bool auth(string $username, string $password);
  #   string $username - Your SMTP username.
  #   string $password - Your SMTP password.
  #
  # returns bool - TRUE is issued if you authenticated with the server successfully, otherwise FALSE.
  #
  public function auth($username, $password)
  {
    # Not connected? Then you can't authenticate...
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot authenticate.';
      return false;
    }

    # We want to authenticate with you Mr. Server.
    fwrite($this->con, "AUTH LOGIN\r\n");

    # Did the server accept?
    $reply_code = (int)substr($this->get_response(), 0, 3);

    if($reply_code == 334)
    {
      # Send your username, base64 encoded.
      fwrite($this->con, base64_encode($username). "\r\n");
      $reply_code = (int)substr($this->get_response(), 0, 3);

      if($reply_code != 334)
      {
        $this->errors[] = 'The server did not accept the SMTP username.';
        return false;
      }

      # Still going? PASSWORD!
      fwrite($this->con, base64_encode($password). "\r\n");
      $reply_code = (int)substr($this->get_response(), 0, 3);

      # Didn't like your password? :/
      if($reply_code != 235)
      {
        $this->errors[] = 'The server did not accept the SMTP password.';
        return false;
      }
      else
        return true;
    }
    else
    {
      $this->errors[] = 'The server '. htmlspecialchars($this->smtp_host). ' refused to authenticate.';
      return false;
    }
  }

  #
  # Sends the MAIL FROM header which tells the SMTP Server who the email
  # is sent from.
  #
  # bool mail_from(string $from);
  #   string $from - The email to set the from too. Ex: you@example.com
  #
  # returns bool - TRUE if it was accepted, FALSE if not.
  #
  # NOTE: Please note that you cannot do "Your name" <you@example.com> as
  #       it will not be accepted. You can specify that, if you want as
  #       FROM in the additional_headers array parameter in SMTP::send()
  #
  public function mail_from($from)
  {
    # Not connected? Fail.
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot send the MAIL FROM header.';
      return false;
    }

    fwrite($this->con, "MAIL FROM: <$from>\r\n");

    # Did Mr. Server accept?
    $reply_code = (int)substr($this->get_response(), 0, 3);

    if($reply_code == 250)
    {
      $this->mail_from = $from;
      return true;
    }
    else
    {
      $this->errors[] = 'The server did not accept the email '. htmlspecialchars($from). ' as the MAIL FROM.';
      return false;
    }
  }

  #
  # Sends the email and any headers to the SMTP Server.
  #
  # bool send(mixed $to, string $subject, string $message[, string $alt_message = null[, array $additional_headers = array()]]);
  #   mixed $to - This can be an array of addresses, or a string of one addresses
  #               or multiple addresses separated by commas.
  #   string $subject - The Subject of the email message.
  #   string $message - The email message to send.
  #   string $alt_message - If HTML is set, this can be set so if the recievers email client
  #                         has HTML disabled or is not supported.
  #   array $additional_headers - An associative array (Header => Value) containing
  #                               additional headers you want set.
  #
  # returns bool - If the message was sent without error, TRUE is issued.
  #                Otherwise false is returned.
  #
  # NOTE: If the message was sent successfully, the connection to the SMTP server
  #       is automatically closed.
  #
  public function send($to, $subject, $message, $alt_message = null, $additional_headers = array())
  {
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot send a message.';
      return false;
    }

    # Is the to parameter not an array? We'll just fix that.
    if(!is_array($to))
    {
      # Remove < and >, we do that ourselves.
      $to = strtr($to, array('<' => '', '>' => ''));

      if(strpos($to, ',') !== false)
        $to = explode(',', $to);
      else
        $to = array($to);
    }
    elseif(strpos(implode($to), '<') !== false)
    {
      # Grrr! No < or >!
      foreach($to as $key => $mail)
        $to[$key] = strtr($mail, array('<' => '', '>' => ''));
    }

    # Send the RCPT TO headers...
    foreach($to as $rcpt)
    {
      # Just incase :)
      $rcpt = trim($rcpt);
      if(empty($rcpt))
        continue;

      fwrite($this->con, "RCPT TO: <$rcpt>\r\n");

      # Did Mr. Server like it?
      $reply_code = (int)substr($this->get_response(), 0, 3);
      if($reply_code != 250)
        $this->errors[] = 'The email <'. htmlspecialchars($rcpt). '> was not accepted by the server.';
    }

    # Begin to send data, like extra headers.
    fwrite($this->con, "DATA\r\n");
    $reply = $this->get_response();
    $reply_code = (int)substr($reply, 0, 3);

    if($reply_code != 354)
    {
      $this->errors[] = 'For an unknown reason, the SMTP server '. htmlspecialchars($this->smtp_host). ' did not accept DATA.';
      var_dump($reply);
      return false;
    }

    # Additional headers perhaps?
    if(!is_array($additional_headers))
      $additional_headers = array();

    if(count($additional_headers))
      foreach($additional_headers as $header => $value)
      {
        if(strtoupper($header) != $header)
        {
          unset($additional_headers[$header]);
          $additional_headers[strtoupper($header)] = $value;
        }
      }

    # Set the subject, and a couple others too maybe.
    $additional_headers['SUBJECT'] = $subject;

    # If no from is set, use the one in MAIL FROM.
    if(empty($additional_headers['FROM']))
      $additional_headers['FROM'] = $this->mail_from;

    # Same with TO, nothing set, then we will...
    if(empty($additional_headers['TO']) && empty($additional_headers['CC']) && empty($additional_headers['BCC']))
      $additional_headers['TO'] = '<'. implode('>, <', $to). '>';

    # We need a date, unless you set one yourself.
    if(empty($additional_headers['DATE']))
      $additional_headers['DATE'] = date('r');

    # Set the content type :) Which allows or disallows HTML.
    $additional_headers['CONTENT-TYPE'] = (!empty($this->is_html) ? 'text/html' : 'text/plain'). '; charset='. $this->charset;

    # No MIME-Version..? :|
    if(empty($additional_headers['MIME-VERSION']))
      $additional_headers['MIME-VERSION'] = '1.0';

    # Priority perhaps?
    if(empty($additional_headers['PRIORITY']))
      $additional_headers['PRIORITY'] = $this->priority;

    # Set the X-Mailer XD.
    $additional_headers['X-MAILER'] = 'PHP/'. phpversion(). ' via the PHP SMTP Class';

    # Send all them headers... At one time.
    $headers = array();

    # But hold on, we may need to change the content-type again.
    if($this->is_html && !empty($alt_message))
    {
      # Okay, multipart message...
      unset($additional_headers['CONTENT-TYPE']);

      # Set a boundary which separates the different parts... :)
      $boundary = substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_abcdefghijklmnopqrstuvwxyz'), 0, 32);
      $boundary_header = "\r\nContent-Type: multipart/alternative; boundary=\"$boundary\"";
    }

    foreach($additional_headers as $header => $value)
      $headers[] = $header. ': '. $value;

    fwrite($this->con, implode("\r\n", $headers). (isset($boundary_header) ? $boundary_header : ''). "\r\n\r\n");

    # New lines are ended with \n not \r\n ;)
    $message = str_replace("\r\n", "\n", $message);

    # Word wrap!
    $message = wordwrap($message, 70);

    # A little Windows fix.
    if(substr(PHP_OS, 0, 3) == 'WIN')
      $message = str_replace("\n.", "\n..", $message);

    # Now send the message.
    if(!isset($boundary))
      fwrite($this->con, "$message\r\n.\r\n");
    else
    {
      # Plain text first. Just 'cause.
      # \r\n -> \n
      $alt_message = str_replace("\r\n", "\n", $alt_message);

      # The alternate message needs a word wrap too.
      $alt_message = wordwrap($alt_message, 70);

      # But do a fix to the alternate message.
      if(substr(PHP_OS, 0, 3) == 'WIN')
        $alt_message = str_replace("\n.", "\n..", $alt_message);

      $body = "--{$boundary}\r\nContent-Type: text/plain; charset={$this->charset}\r\n\r\n$alt_message\r\n\r\n";

      # HTML now :P
      $body .= "\r\n--{$boundary}\r\nContent-Type: text/html; charset={$this->charset}\r\n\r\n$message\r\n\r\n";

      # Now end the message.
      $body .= "--{$boundary}--\r\n.\r\n";

      # Now, send it!
      fwrite($this->con, $body);
    }

    # So, did it work?
    $reply_code = (int)substr($this->get_response(), 0, 3);

    if($reply_code == 250)
    {
      # Yay! Now close the connection.
      $this->close(true);
      return true;
    }
    else
    {
      $this->errors[] = 'The SMTP server did not accept the message for an unknown reason.';
      return false;
    }
  }

  #
  # Close the connection to the current SMTP server.
  #
  # bool close([bool $quit = false]);
  #   bool $quit - TRUE if you want the QUIT command to be issued to close
  #                the connection with the SMTP server.
  #
  # returns bool - If the connection was closed, TRUE is issued. Otherwise FALSE.
  #
  public function close($quit = false)
  {
    if(empty($this->con))
    {
      $this->errors[] = 'Could not close connection to the server because none is open.';
      return false;
    }

    # Send QUIT? Okay.
    if(!empty($quit))
    {
      fwrite($this->con, "QUIT\r\n");
      $this->get_response();
    }

    # Set everything back.
    $this->smtp_host = null;
    $this->smtp_port = 25;
    $this->is_tls = false;
    $this->tryfor = 5;
    $this->mail_from = null;

    return @fclose($this->con);
  }

  #
  # Sets whether or not the message will allow HTML.
  #
  # bool set_html([bool $html_allowed = true]);
  #   bool $html_allowed - TRUE if you want to allow HTML to be sent in the message.
  #
  # returns bool - TRUE if the setting was successfully changed, FALSE otherwise.
  #
  public function set_html($html_allowed = true)
  {
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot set whether or not the message is HTML.';
      return false;
    }

    $this->is_html = !empty($html_allowed);

    return true;
  }

  #
  # Sets the priority of the message.
  #
  # bool set_priority([string $priority = 'normal']);
  #   string $priority - The priority to set for the message. Acceptable values are:
  #                      highest, high, normal, belownormal and low.
  #
  # returns bool - TRUE if the setting was successfully changed, FALSE otherwise.
  #
  public function set_priority($priority = 'normal')
  {
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot set the messages priority.';
      return false;
    }

    $priority = strtolower($priority);

    # So is it a valid priority?
    if(in_array($priority, array('highest', 'high', 'normal', 'belownormal', 'low')))
    {
      $this->priority = $priority;
      return true;
    }
    else
    {
      $this->errors[] = 'The priority '. htmlspecialchars($priority). ' was not an acceptable value.';
      return false;
    }
  }

  #
  # Sets your desired email charset. Such as UTF-8
  #
  # bool set_charset($charset);
  #   string $charset - The chacter set to apply to the email.
  #
  # returns bool - TRUE if the setting was successfully changed, FALSE otherwise.
  #
  public function set_charset($charset)
  {
    if(empty($this->con))
    {
      $this->errors[] = 'You are not yet connected to a server so you cannot set messages character set.';
      return false;
    }

    $this->charset = !empty($charset) ? $charset : $this->charset;

    return true;
  }

  #
  # Returns errors reported by this class.
  #
  # mixed error([$last_error = true]);
  #   $last_error - TRUE if you want the last error returned. If FALSE is set, then the
  #                 whole array of errors is returned.
  #
  # returns mixed - If $last_error is true, a string is returned, if it is false, an array
  #                 will be returned. FALSE will be returned if there are no errors.
  #
  public function error($last_error = true)
  {
    if(count($this->errors) == 0)
      return false;

    if(!empty($last_error))
      return $this->errors[count($this->errors) - 1];
    else
      return $this->errors;
  }
}
?>

