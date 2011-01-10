/*
---
script: Carousel.js
license: MIT-style license.
description: Tab - Minimalistic but extensible tab swapper.
copyright: Copyright (c) 2010 Thierry Bela
authors: [Thierry Bela]

requires: 
  core:1.2.3: 
  - Class.Extras
  - Element.Event
  - Element.Style
  - Element.Dimensions
  - Array
provides: [Carousel]
...
*/

(function () {

function style(el, style) {

	var mrg = el.getStyle(style);
	
	return mrg == 'auto' ? 0 : mrg.toInt() 
}

var Carousel = this.Carousel = new Class({

		Implements: [Options, Events],
		options: {
		
		/*
			circular: false,
			onChange: function (index) {
			
			},
			previous: element1,
			next: element2,
			container: null,
			selector: '',
		*/
			link: 'cancel',
			mode: 'horizontal',
			animation: 'Move',
			scroll: 4,
			distance: 1,
			fx: {
			
				link: 'cancel',
				transition: 'sine:out',
				duration: 500
			}
		},
		plugins: {},
		initialize: function (options) {
		
			this.addEvent('change', function (current) {
			
				this.current = current
				
			}.bind(this)).setOptions(options);
			
			['previous', 'next'].each(function (val) {
				
				if($(this.options[val])) $(this.options[val]).addEvent('click', function (e) {
				
					e.stop();
					this[val]()
					
				}.bind(this))
				
			}, this);
			
			this.elements = $(options.container).getChildren(options.selector);
			
			this.current = 0;
			this.anim = new this.plugins[this.options.animation](this);
			
			this.move(this.options.current || 0);
		},
		
		isVisible: function (index) {
		
			if($type($(index)) == 'element') index = this.elements.indexOf($(index));
			
			var length = this.elements.length,
				current = this.current,
				scroll = this.options.scroll;
			
			if(current <= index && index < current + scroll) return true;
			
			if(this.options.circular) for(var i = 1; i < scroll; i++) {
			
				if((i + current)  % length == index) return true;
			}
			
			return false
		},
		
		first: function () {
		
			return this.current
		},
		
		previous: function (direction) {
	
			return this.move(this.current - this.options.distance, direction)
		},
		
		next: function (direction) {
		
			return this.move(this.current + this.options.distance, direction)
		},
		
		move: function (index, direction) {
		
			var elements = this.elements,
				current = this.current,
				length = elements.length,
				scroll = this.options.scroll;
			
			if($type($(index)) == 'element') index = elements.indexOf($(index));
			
			if(!this.options.circular) {
		
				if(index > length - scroll) index = length - scroll
			}	
				
			else {
			
				if(index < 0) index += length;
				index %= Math.max(length, 1)
			}			
		
			if(index < 0 || length <= scroll || index >= length) return this;

			if(direction == undefined) {
				
				//detect direction. inspired by moostack
				var forward = current < index ? index - current : elements.length - current + index,
					backward = current > index ? current - index : current + elements.length - index;
				
				direction = Math.abs(forward) <= Math.abs(backward) ? 1 : -1
			}			
			
			this.anim.move(this, index, direction);
			
			return this
		}
	});
	
	Carousel.prototype.plugins.Move = new Class({
	
		initialize: function (carousel) {
		
			var up = this.up = carousel.options.mode == 'vertical',
				options = this.options = carousel.options,
				elements = this.elements = carousel.elements,
				parent = elements[0].getParent();
				
			parent.setStyles({height: elements[0].setStyle('display', 'block').getStyle('height'), position: 'relative', overflow: 'hidden'}).getStyle('padding' + (this.up ? 'Top' : 'Left'));
			elements.each(function (el) { 
					
				el.setStyles({display: 'block', position: 'absolute'})
					
			});
			
			this.property = 'offset' + (up ? 'Top' : 'Left');
			this.margin = up ? ['marginTop', 'marginBottom'] : ['marginLeft', 'marginRight'];
			this.padding = style(parent, up ? 'paddingTop' : 'paddingLeft');
			this.pad = style(parent, 'paddingLeft');
		
			this.reorder(0, 1).fx = new Fx.Elements(elements, options.fx).addEvents({onStart: function () { carousel.active = true }, onComplete: function () { carousel.active = false }})
		},
		
		reorder: function (offset, direction) {
		
			var options = this.options,
				panels = this.elements,
				panel,
				prev,
				ini = pos = this.padding,
				pad = this.pad,
				i,
				index,
				length = panels.length,
				horizontal = options.mode == 'horizontal',
				side = horizontal ? 'offsetWidth' : 'offsetHeight';
								
			//rtl
			if(direction == -1) {
			
				for(i = length; i > options.scroll - 1; i--) {
			
					index = (i + offset + length) % length;
					prev = panel;
					panel = panels[index];
					
					if(prev) pos -= style(prev, this.margin[0]);
					
					if(horizontal) panel.setStyle('left', pos);
					else panel.setStyles({left: pad, top: pos});
					pos -= (panel[side] + style(panel, this.margin[1]));
				}
				
				pos = ini + panel[side] + style(panel, this.margin[0]);
				
				for(i = 1; i < options.scroll; i++) {
			
					index = (i + offset + length) % length;
					
					prev = panel;
					panel = panels[index];			
					
					if(prev) pos += style(prev, this.margin[1]);
					if(horizontal) panel.setStyle('left', pos);
					else panel.setStyles({left: pad, top: pos});
					pos += panel[side] + style(panel, this.margin[0]);		
				}
				
				//ltr
			} else if(direction == 1) for(i = 0; i < length; i++) {
			
				index = (i + offset + length) % length;
				prev = panel;
				panel = panels[index];				
				
				if(horizontal) panel.setStyle('left', pos);
				else panel.setStyles({left: pad, top: pos});
				pos += panel[side] + style(panel, this.margin[0]);
				if(prev) pos += style(prev, this.margin[1]);
			}
			
			return this
		},
		
		move: function (carousel, current, direction) {
		
			var obj = {}, 
				up = this.up,
				property = this.property,
				offset;
		
			if(this.options.circular) this.reorder(carousel.current, direction);
			
			offset = carousel.elements[current][property] - this.padding;
			
			carousel.elements.each(function (el, index) {
			
				obj[index] = up ? {top: el[property] - offset} : {left: el[property] - offset}
			});
			
			this.fx.cancel().start(obj).chain(function () { carousel.fireEvent('change', current) })
		}
	})
})();

