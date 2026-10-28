<?php
// Run with: docker run --rm -v "$PWD/tests:/tests:ro" blackantmedia:php84-security php /tests/markdown.php
error_reporting(E_ALL);
set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});
require '/var/www/html/app/parsers/markdown-parser.inc.php';

$cases = array(
  array("Heading\n=======\n", '<h1>Heading</h1>'),
  array("## Heading {#example}\n", '<h2 id="example">Heading</h2>'),
  array('***nested*** and `code`', '<strong><em>nested</em></strong>'),
  array('[link](https://example.com)', '<a href="https://example.com">link</a>'),
  array("~~~\n<code>\n~~~\n", '&lt;code&gt;'),
  array("Name | Value\n---- | -----\nOne | Two\n", '<table>'),
  array("A note[^1].\n\n[^1]: Footnote text\n", 'Footnote text'),
  array("é\ttext\n", 'é'),
);
foreach ($cases as $case) {
  $html = Markdown($case[0]);
  if (strpos($html, $case[1]) === false) {
    throw new RuntimeException('Markdown regression: '.$case[0].' => '.$html);
  }
}
echo 'PASS: '.count($cases)." Markdown cases with all PHP diagnostics enabled\n";
