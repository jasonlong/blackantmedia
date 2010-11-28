window.addEvent('domready', function() {  
  initTypography();
  initBGScroll();
  observeNav();
  
  var form = new FlippingForm($('contact-wrapper'), {});
});

var FlippingForm = new Class({
  Implements: [Options, Events],
  Binds: ["flipForm", "dropForm"],
  
  options: {
    dropDelay: 2500
  },
  initialize: function(container, options) { 
    this.setOptions(options);
    this.container = $(container);
    this.form = this.container.getElement('form');

    new Form.Validator.Inline(this.form);
    new Form.Request(this.form, this.container, {
        requestOptions: {
          useSpinner: false
        },
        onSend: this.flipForm
    });
  },

  flipForm: function() {
    $$('#from').set('html', $('name').get('value'));
    this.container.addClass('flip'); 
    $$('#mail-slot').show();

    (function() { this.dropForm(); }).delay(2500, this);
    (function() { $('thanks').reveal({duration: 1000});}).delay(3500, this);
  },

  dropForm: function() {
    this.container.setStyle('overflow', 'hidden');
    this.container.getChildren('.inner').move({
      relativeTo: this.container,
      offset: {x: 0, y: 500},
      transition: Fx.Transitions.Quint.easeIn      
    });
  }
});

function observeContactForm() {
  
  new Form.Validator.Inline($('contact-form'));
  new Form.Request($('contact-form'), $('contact-wrapper'), {
      requestOptions: {
        useSpinner: false
      },
      onSend: showEnvelopeAnimation
  });
  
  // $$('#send-another').addEvent('click', function(e) {
    // e.stop();
    // $$('#thanks').hide();
    // $$('#mail-slot').hide();    
    // $$('#contact-wrapper').setStyle('overflow', 'visible');
    // $$('#contact-wrapper').removeClass('flip');     
    // $$('#contact-wrapper .inner').move({
      // relativeTo: $('contact-wrapper'),
      // offset: {x: 0, y: -500},
      // transition: Fx.Transitions.Quint.easeOut        
    // });
    // $$('#message').set('value', '');
    // setTimeout(function() {        
      // $('message').focus();
    // }, (500));      
  // })
}

// function showEnvelopeAnimation() {
  // $$('#from').set('html', $('name').get('value'));
  // $$('#contact-wrapper').addClass('flip'); 
  // setTimeout(function() {
    // $$('#contact-wrapper').setStyle('overflow', 'hidden');
    // $$('#contact-wrapper .inner').move({
      // relativeTo: $('contact-wrapper'),
      // offset: {x: 0, y: 500},
      // transition: Fx.Transitions.Quint.easeIn      
    // });
  // }, (2500));
  // $$('#mail-slot').show();
  // setTimeout(function() {    
    // $$('#thanks').reveal({duration: 1000});    
  // }, (3500));      
// }

function observeNav() {
  $$('nav ul li a.section').addEvent('click', function(e) {
    e.stop();
    var myFx = new Fx.Scroll(window).toElement(this.get('data-nav-section'));    
  });
}

function initTypography() {
  try {
    Typekit.load({
      active: function() {
        $$('#content').tween('opacity', '1');
      },
      inactive: function() {
        $$('#content').tween('opacity', '1');
      }
    })
  } catch(e) {}  
}

function initBGScroll() {
  positionBG();
  window.addEvent('scroll', function(event) {
    positionBG();
  });  
}

function positionBG() {
  var scroll = window.getScroll();  
  $$('img#bg').setStyle('top', '-' + 0.3*scroll.y + 'px')    
}


/*
$$('#slide-out-trigger').addEvent('click', function(e) {
  e.stop();
  $('slider1').move({
    position: 'upperLeft',
    edge: 'upperRight'
  })
  $('slider2').move({
    position: 'upperRight',
    edge: 'upperLeft',
    // offset: {x: 100, y: 0}       
  })
});

$$('#slide-in-trigger').addEvent('click', function(e) {
  e.stop();
  $('slider1').move({
    relativeTo: $('content'),
    position: 'upperLeft',
    edge: 'upperLeft',
    transition: Fx.Transitions.Back.easeOut      
  })
  $('slider2').move({
    relativeTo: $('content'),      
    position: 'upperRight',
    edge: 'upperRight',
    transition: Fx.Transitions.Back.easeOut
  })
});
*/
