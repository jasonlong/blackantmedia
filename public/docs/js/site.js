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
    services: '',
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
  current_project_index: 0,

  initialize: function(container, options) { 
    this.setOptions(options);
    this.container = $(container);
    this.loadAllProjects(this.options.loadAllProjectsURL);
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
      }.bind(this)
    }).send();
  },

  initThumbnails: function() {
    var thumbnails = [];

    new Element('ol', {
      id: 'portfolio'
    }).inject(this.container, 'top');

    this.projects.each(function(p, index) {
      var thumbnailContainer = new Element('li', {
        styles: {top: p.position.y, left: p.position.x},
      }).inject($('portfolio'), 'bottom');

      thumbnails.include(p.project.options.thumbnailImageURL);

      var link = 
        new Element('a', {
          href: '#',
          'data-project-index': index 
        }).adopt(
          new Element('img', {
            src: '/projects/'+p.project.options.thumbnailImageURL,
            styles: {top: 128} /* hide images to start with */
          })
      );

      var project_link = link.addEvent('click', function(e) {
        e.stop();
        this.switchToProject(project_link.get('data-project-index'));
      }.bind(this));
      thumbnailContainer.adopt(link);

      // make sure images are complete pre-loaded before displaying them
      var loader = new Asset.images(thumbnails, {
        onComplete: function() {this.showThumbnails();}.bind(this)
      });

    }.bind(this));
  },

  findProjectByURL: function(url) {
    this.projects.each(function(p) {
      if (p.options.url == url) return p;
    });
    return null;
  },

  switchToProject: function(project_index) {
    this.current_project_index = project_index;
    if (!$$('#portfolio-wrapper figure').length) {
      this.initProjectDetailContainer();
    }
    this.hideThumbnails();
    this.hideProjectDetails();
    (function() { this.loadProjectDetails(this.projects[project_index].project); }).delay(250, this);
  },

  initProjectDetailContainer: function() {
    var figure = new Element('figure');
    var figcaption = new Element('figcaption', {styles: {position: 'absolute', left: window.getSize().x}});
    var h3 = new Element('h3', {styles: {display: 'block'}});
    var h4 = new Element('h4', {styles: {display: 'block'}});
    var p = new Element('p');
    figcaption.adopt(h3, h4, p);
    figure.adopt(figcaption);
    figure.inject(this.container, 'top');
  },

  loadProjectDetails: function(project) {
    if (project.options.description) {
      this.showProjectDetails(project);
    }
    else {
      var request = new Request.JSON({
        url: project.options.url,
        onFailure: function(xhr) {
          alert("Well this is embarassing, that project couldn't be loaded right now. Please try again in a little bit.");
        },
        onSuccess: function(data) {
          project.options.services = data.services;
          project.options.description = data.description;
          this.showProjectDetails(project);
        }.bind(this)
      }).send();
    }
  },

  showProjectDetails: function(project) {
    this.container.getChildren('figure h3').set('html', project.options.name);
    this.container.getChildren('figure h4').set('html', project.options.services);
    this.container.getChildren('figure p').set('html', project.options.description);
    (function() {
      this.container.getChildren('figure figcaption').move({
        relativeTo: this.container,
        position: 'upperLeft',
        offset: {x: 595, y: 45},
        transition: Fx.Transitions.Back.easeInOut,
        duration: 250
      });
    }).delay(500, this);
    this.container.getChildren('figure h3').setStyle('display', 'inline-block');
    this.container.getChildren('figure h4').setStyle('display', 'inline-block');
    (function() { this.showProjectNav(project); }).delay(1000, this); 
  },

  hideProjectDetails: function() {
    this.container.getChildren('figure figcaption').move({
      relativeTo: this.container,
      position: 'upperLeft',
      offset: {x: window.getSize().x, y: 45},
      transition: Fx.Transitions.Back.easeInOut,
      duration: 250
    });
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

  getPreviousProjectIndex: function() {
    if (parseInt(this.current_project_index) === 0) {
      return this.projects.length - 1;
    }
    else {
      return parseInt(this.current_project_index)-1;
    }
  },

  getPreviousProject: function() {
    return this.projects[this.getPreviousProjectIndex()].project;
  },

  getNextProjectIndex: function() {
    if (parseInt(this.current_project_index) == this.projects.length - 1) {
      return 0;
    }
    else {
      return parseInt(this.current_project_index)+1;
    }
  },
  
  getNextProject: function() {
    return this.projects[this.getNextProjectIndex()].project;
  },

  showProjectNav: function() {
    if ($('project-nav') === null) {
      this.initProjectNav();
    }
    $('project-nav-previous').getChildren('a').set({
      html: 'Previous <span>'+this.getPreviousProject().options.name+'</span>',
      'data-project-index': this.getPreviousProjectIndex()
    });
    $('previous-project-list').move({
      relativeTo: $('project-nav-previous'),
      position: 'upperLeft',
      edge: 'upperLeft',
      offset: {x: 0, y: -26 * this.getPreviousProjectIndex()},
      transition: Fx.Transitions.Back.easeInOut,
      duration: 250
    });
    $('next-project-list').move({
      relativeTo: $('project-nav-next'),
      position: 'upperRight',
      edge: 'upperRight',
      offset: {x: 0, y: -26 * this.getNextProjectIndex()},
      transition: Fx.Transitions.Back.easeInOut,
      duration: 250
    });
    $('project-nav').move({
      relativeTo: this.container,
      position: 'upperLeft',
      offset: {x: 0, y: 0},
      transition: Fx.Transitions.Back.easeInOut,
      duration: 250
    });
    $('previous-project-list').fade('in');
    $('next-project-list').fade('in');
  },

  hideProjectNav: function() {
    $('previous-project-list').fade('out');
    $('next-project-list').fade('out');
    $('project-nav').move({
      relativeTo: this.container,
      position: 'upperLeft',
      offset: {x: 0, y: -30},
      transition: Fx.Transitions.Back.easeInOut,
      duration: 250
    });
    // $('previous-project-list').move({
      // relativeTo: this.container,
      // position: 'upperLeft',
      // offset: {x: 0, y: -1000},
      // transition: Fx.Transitions.Back.easeInOut,
      // duration: 0
    // });
    // $$('#next-project-list').move({
      // relativeTo: this.container,
      // position: 'upperRight',
      // offset: {x: 0, y: -1000},
      // transition: Fx.Transitions.Back.easeInOut,
      // duration: 0
    // });
  },

  initProjectNav: function() {
    if ($('project-nav') != null) return;

    var nav_wrapper = new Element('div', {
                                  id: 'project-nav-wrapper',
                                  styles: {
                                    height: 30,
                                    width: '100%',
                                    overflow: 'hidden',
                                    position: 'absolute'
                                  }
    });
    var nav = new Element('nav', {id: 'project-nav', styles: {position: 'absolute', top: -30, width: '100%'}});
    var nav_list = new Element('ol');

    var nav_previous =  new Element('li', {id: 'project-nav-previous'});
    var nav_up       =  new Element('li', {id: 'project-nav-up'}).adopt(
                        new Element('a', {href: '#', html: 'All Projects'}));
    var nav_next     =  new Element('li', {id: 'project-nav-next'});

    var nav_next_projects = new Element('ol', {id: 'next-project-list', styles: {opacity: 0}});
    var nav_previous_projects = new Element('ol', {id: 'previous-project-list', styles: {opacity: 0}});
    this.projects.each(function(p, index) {
      var previous_link = new Element('a', {
        href: '#', 
        html: 'Previous <span>'+p.project.options.name+'</span>',
        'data-project-index': index 
      });
      var next_link = new Element('a', {
        href: '#', 
        html: 'Next <span>'+p.project.options.name+'</span>',
        'data-project-index': index 
      });
      previous_link.addEvent('click', function(e) {
        e.stop();
        this.switchToProject(previous_link.get('data-project-index'));
      }.bind(this));
      next_link.addEvent('click', function(e) {
        e.stop();
        this.switchToProject(next_link.get('data-project-index'));
      }.bind(this));
      nav_previous_projects.adopt(new Element('li').adopt(previous_link));
      nav_next_projects.adopt(new Element('li').adopt(next_link));
    }.bind(this));
    nav_previous.adopt(nav_previous_projects);
    nav_next.adopt(nav_next_projects);

    nav_list.adopt(nav_previous, nav_up, nav_next);
    nav.adopt(nav_list);
    nav_wrapper.adopt(nav);
    nav_wrapper.inject(this.container, 'top');

    $$('#project-nav-up a').addEvent('click', function(e) {
      e.stop();
      this.hideProjectDetails();
      (function() { this.hideProjectNav(); }).delay(500, this); 
      (function() { this.showThumbnails(); }).delay(1000, this);
    }.bind(this));
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
          this.showErrorMessage()
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



