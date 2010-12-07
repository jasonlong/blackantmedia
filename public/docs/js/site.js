window.addEvent('domready', function() {  
  initTypography();
  initBGScroll();
  observeNav();
  
  var form = new FlippingContactForm($('contact-wrapper'), {});
});

var Project = new Class({
  Implements: [Options, Events],

  options: {
    name: '',
    description: '',
    thumbnailImageURL: '',
    url: ''
  },

  initialize: function(options) { 
    this.setOptions(options);
  }
});

var Portfolio = new Class({
  Implements: [Options, Events],

  options: {
    loadAllProjectsURL: '/work/',
    thumbnailColumns: 3,
    thumbnailWidth: 286,
    thumbnailHeight: 128,
    thumbnailMargin: 20
  },
  projects: [], 

  initialize: function(container, options) { 
    this.setOptions(options);
    this.container = $(container);
    this.loadAllProjects(this.options.loadAllProjectsURL);

    ///////////////////
    $('tmp').addEvent('click', function(e) {
      e.stop();
      this.showThumbnails();
    }.bind(this));
    ///////////////////
  },

  loadAllProjects: function(url) {
    var request = new Request.JSON({
      url: this.options.loadAllProjectsURL,
      onFailure: function(xhr) {
        alert("Well this is embarassing, my projects couldn't be loaded right now. Please try again in a little bit.");
      },
      onSuccess: function(data) {
        var i=0;
        data.projects.each(function(project_data) {
          position = this.computePosition(i+1);
          var p = new Hash();
          p.set('project', new Project({
            name:project_data.title, 
            thumbnailImageURL:project_data.thumb,
            url: project_data.url
          }));
          p.set('position', {
            x:position.get('x'),
            y:position.get('y')
          });
          this.projects.include(p);
          i++;
        }.bind(this));

        this.initThumbnails();
        this.showThumbnails();
      }.bind(this)
    }).send();
      
  },

  initThumbnails: function() {
    new Element('ol', {
      id: 'portfolio'
    }).inject(this.container, 'top');

    this.projects.each(function(p) {
      var thumbnailContainer = new Element('li', {
        styles: {top: p.position.y, left: p.position.x},
      }).inject($('portfolio'), 'bottom');

      var link = 
        new Element('a', {
          href: '#'
        }).adopt(
          new Element('img', {
            src: '/projects/'+p.project.options.thumbnailImageURL,
            styles: {top: 128} /* hide images to start with */
          })
        );

      link.addEvent('click', function(e) {
        e.stop();
        var request = new Request.JSON({
          url: p.project.options.url
        }).send();
        this.hideThumbnails();
      }.bind(this));
      thumbnailContainer.adopt(link);
    }.bind(this));
   },

   showThumbnails: function() {
     $$('ol#portfolio li img').each(function(img, index) {
      (function() {
        img.move({
          relativeTo: img.getParent('li'),
          offset: {x: 0, y: -128},
          transition: Fx.Transitions.Bounce.easeOut      
        });
      }).delay(index*40);
     });
   },

   hideThumbnails: function() {
     $$('ol#portfolio li img').each(function(img, index) {
      (function() {
        img.move({
          relativeTo: img.getParent('li'),
          offset: {x: 0, y: 128},
          transition: Fx.Transitions.Back.easeInOut,
          duration: 250
        });
      }).delay(index*30);
     });
   },

   computePosition: function(count) {
     var row = Math.ceil(count / this.options.thumbnailColumns);
     var column = count % this.options.thumbnailColumns;
     if (column == 0) column = 3;
     var x = (column - 1) * (this.options.thumbnailWidth+this.options.thumbnailMargin);
     var y = (row - 1) *  (this.options.thumbnailHeight+this.options.thumbnailMargin);
     var position = new Hash();
     position.set('x', x);
     position.set('y', y);
     return position;
   }
});

var FlippingContactForm = new Class({
  Implements: [Options, Events],
  
  options: {
    dropDelay: 2500,
    thanksDelay: 3500
  },
  senderName: '',
  senderEmail: '',
  
  initialize: function(container, options) { 
    this.setOptions(options);
    this.container = $(container);
    this.form = this.container.getElement('form');

    new Form.Validator.Inline(this.form);
    new Form.Request(this.form, null, {
        requestOptions: {
          useSpinner: false
        },
        onSend: function() {
          this.flipForm()
        }.bind(this),
        onSuccess: function(target, response) {
          var status = JSON.decode(response[0].data.clean(), true);
          if (status == null) {
            this.showErrorMessage()
          }
          else if (status.code == "1") {
            this.showThanks()
          }
          else {
            this.showErrorMessage()
          }
        }.bind(this),
        onFailure: function() {
          alert('failed');
        }.bind(this)
    });
    $$('#send-another').addEvent('click', function(e) {
      e.stop();
      this.resetForm();
    }.bind(this));
  },

  flipForm: function() {
    $('from').set('html', $('name').get('value'));
    this.senderName = $('name').get('value');
    this.senderEmail = $('email').get('value');
    $$('#mail-slot').show();
    this.container.addClass('flip'); 
    (function() { this.dropForm(); }).delay(this.options.dropDelay, this);
    if (!Modernizr.csstransforms3d) {
      $('form-wrapper').morph({opacity: 0});
      $('envelope').morph({opacity: 1});
    }
  },

  dropForm: function() {
    this.container.setStyle('overflow', 'hidden');
    this.container.getChildren('.inner').move({
      relativeTo: this.container,
      offset: {x: 0, y: 500},
      transition: Fx.Transitions.Quint.easeIn      
    });
  },

  showThanks: function() {
    (function() { $('thanks').reveal({duration: 1000}); }).delay(this.options.thanksDelay, this);
  },

  showErrorMessage: function() {
    (function() { $('error').reveal({duration: 1000}); }).delay(this.options.thanksDelay, this);
  },

  resetForm: function() {
    $$('#thanks').hide();
    $$('#mail-slot').hide();    
    this.container.setStyle('overflow', 'visible');
    this.container.removeClass('flip');     
    this.container.getChildren('.inner').move({
      relativeTo: this.container,
      offset: {x: 0, y: -500},
      transition: Fx.Transitions.Quint.easeOut        
    });
    if (!Modernizr.csstransforms3d) {
      $('form-wrapper').morph({opacity: 1});
      $('envelope').morph({opacity: 0});
    }
    $('name').set('value', this.senderName);
    $('email').set('value', this.senderEmail);
    $('message').set('value', '');
    (function() { $('message').focus(); }).delay(500, this);
  }
});

function observeNav() {
  $$('nav ul li a.section').addEvent('click', function(e) {
    e.stop();
    var myFx = new Fx.Scroll(window).toElement(this.get('data-nav-section'));    
  });
}

function initPortfolio() {
  var portfolio = new Portfolio($('portfolio-wrapper'), {
    loadAllProjectsURL: '/work/'
  });
}

function initTypography() {
  try {
    Typekit.load({
      active: function() {
        $$('#content').tween('opacity', '1');
        (function() { initPortfolio(); }).delay(1000);
      },
      inactive: function() {
        $$('#content').tween('opacity', '1');
        (function() { initPortfolio(); }).delay(1500);
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
