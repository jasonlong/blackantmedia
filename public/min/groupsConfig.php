<?php
/**
 * Groups configuration for default Minify implementation
 * @package Minify
 */

/** 
 * You may wish to use the Minify URI Builder app to suggest
 * changes. http://yourdomain/min/builder/
 *
 * See http://code.google.com/p/minify/wiki/CustomSource for other ideas
 **/

return array(
   'js' => array( 
      '//public/docs/js/site.js',
      '//public/docs/js/mootools-more.js',
      '//public/docs/js/modernizr-2.0.min.js'
    ), 
    
    'css' => array(
      '//public/docs/css/reset.css', 
      '//public/docs/css/screen.css' 
    )
);
