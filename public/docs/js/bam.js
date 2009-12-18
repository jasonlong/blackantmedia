$(document).ready(function() {
	progressiveEnhancements();
});

function progressiveEnhancements()
{
  // top lighting effect
	$('body').prepend('<div id="spotlight"></div>');
	
	// wireframe guidelines
  $('<div class="guideline"></div>').prependTo('#colophon').css({'height':'1px', 'width':'100%', 'position':'relative', 'top':'17px'});
  $('<div class="guideline"></div>').prependTo('#colophon .inner').css({'height': $('#colophon').height(), 'width':'1px', 'margin-top':'-15px', 'margin-left':'-1px', 'position':'absolute'});  
  $('<div class="guideline"></div>').prependTo('#colophon .inner').css({'height': $('#colophon').height(), 'width':'1px', 'margin-top':'-15px', 'margin-left':'-20px', 'position':'absolute'});  
  $('<div class="guideline"></div>').prependTo('#colophon .inner').css({'height': $('#colophon').height(), 'width':'1px', 'margin-top':'-15px', 'margin-left':'-200px', 'position':'absolute'});  
  
  $('<div class="guideline"></div>').prependTo('#colophon .inner').css({'height': $('#colophon').height(), 'width':'1px', 'margin-top':'-15px', 'margin-left':'600px', 'position':'absolute'});  
  $('<div class="guideline"></div>').prependTo('#colophon .inner').css({'height': $('#colophon').height(), 'width':'1px', 'margin-top':'-15px', 'margin-left':'620px', 'position':'absolute'});  
  $('<div class="guideline"></div>').prependTo('#colophon .inner').css({'height': $('#colophon').height(), 'width':'1px', 'margin-top':'-15px', 'margin-left':'820px', 'position':'absolute'});  
}