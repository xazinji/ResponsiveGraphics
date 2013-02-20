//Molten Leading
(function($) {
	$.fn.moltenLeading = function( config ) {
		var o = $.extend( {
			minline: 1.2,
			maxline: 1.6,
			minwidth: 320,
			maxwidth: 1024
		}, config ),
		hotlead = function( el ) {
			var $el = $( this !== window ? this : el ),
			widthperc = parseInt( ( $el.width() - o.minwidth ) / ( o.maxwidth - o.minwidth ) * 100, 10 ),
			linecalc = o.minline + ( o.maxline - o.minline ) * widthperc / 100;

			if ( widthperc <= 0 || linecalc < o.minline ) {
				linecalc = o.minline;
			} else if ( widthperc >= 100 || linecalc > o.maxline ) {
				linecalc = o.maxline;
			}

			$el.css( "lineHeight", linecalc );

			$( window ).one( "resize", function() {
				hotlead( $el );
			});
		};

		return this.each( hotlead );
	};
})(jQuery);


/*
* throttledresize: special jQuery event that happens at a reduced rate compared to "resize"
*
* latest version and complete README available on Github:
* https://github.com/louisremi/jquery-smartresize
*
* Copyright 2012 @louis_remi
* Licensed under the MIT license.
*
* This saved you an hour of work?
* Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
*/
(function($) {

	var $event = $.event,
	$special,
	dummy = {_:0},
	frame = 0,
	wasResized, animRunning;

	$special = $event.special.throttledresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
			args = arguments;

			wasResized = true;

			if ( !animRunning ) {
				setInterval(function(){
					frame++;

					if ( frame > $special.threshold && wasResized || execAsap ) {
			// set correct event type
			event.type = "throttledresize";
			$event.dispatch.apply( context, args );
			wasResized = false;
			frame = 0;
		}
		if ( frame > 9 ) {
			$(dummy).stop();
			animRunning = false;
			frame = 0;
		}
	}, 30);
				animRunning = true;
			}
		},
		threshold: 0
	};
})(jQuery);



/*  -----------------------------------------------------------------------------
	::  Old responsive tables helper functions
	----------------------------------------------------------------------------- */

// function splitTable(original){
// 	original.wrap("<div class='table-wrapper' />");

// 	var copy = original.clone();
// 	copy.find("td:not(:first-child), th:not(:first-child)").css("display", "none");
// 	copy.removeClass("responsive");

// 	original.closest(".table-wrapper").append(copy);
// 	copy.wrap("<div class='pinned' />");
// 	original.wrap("<div class='scrollable' />");

// 	setCellHeights(original, copy);
// }

// function unsplitTable(original) {
// 	original.closest(".table-wrapper").find(".pinned").remove();
// 	original.unwrap();
// 	original.unwrap();
// }

// function setCellHeights(original, copy) {
// 	var tr = original.find('tr'),
// 	tr_copy = copy.find('tr'),
// 	heights = [];

// 	tr.each(function (index) {
// 		var self = $(this),
// 		tx = self.find('th, td');

// 		tx.each(function () {
// 			var height = $(this).outerHeight(true);
// 			heights[index] = heights[index] || 0;
// 			if (height > heights[index]) heights[index] = height;
// 		});

// 	});

// 	tr_copy.each(function (index) {
// 		$(this).height(heights[index]);
// 	});
// }


/*  -----------------------------------------------------------------------------
	::  Detect table cell collisions and resize or go responsive
	----------------------------------------------------------------------------- */

;(function ($, window, document, undefined) {

    var pluginName = "responsiveTable",
        defaults = {
            minPadding: 10,
            maxPadding: 30, 
            minFontSize: 10, 
            fontRatio: 1.618
        };	

    // The actual plugin constructor
    function ResponsiveTable(element, options) {
        this.element = element;
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    ResponsiveTable.prototype = {

        init : function() {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).

            var cur = this;
 			
            $(this.element).data('split', false);
            $(this.element).data('splitWidth', null);
            $(this.element).data('reduceFactor', 0);
            $(this.element).data('minDistance', null);

            //Enable measurement of table content width
 			$(this.element).find('td, th').wrapInner('<span />');

 			//Update table state on first run
 			this.detectCollisions(this.element, this.options);

            //Bind throttled resize listener
			$(window).on("throttledresize", function(event){
				cur.detectCollisions(cur.element, cur.options);
			});

        },

        detectCollisions : function(el, options) {

        	var cur = this;

			if(!$(el).data('split')){

				var resized;
				var minDistance = $(el).data('minDistance');

				// For each table cell, detect potential column collisions
				$(el).find("table span").each(function(){

					var contentWidth = $(this).width(); 
					var columnWidth = $(this).parent().width();
					var distance = columnWidth - contentWidth;

					if(minDistance == null || distance < minDistance){
						minDistance = distance;
					}

					//If this cell has less padding than the minimum padding
					if(distance < options.minPadding){

						//Calculate target font size				
						var currentFontSize = parseInt($(this).css("font-size"), 10);
						var targetFontSize = currentFontSize / options.fontRatio;
						
						//If reducing the font will shrink it beyond the min font size, go responsive
						if(targetFontSize < options.minFontSize){
							resized = true;
							return cur.splitTable(el);
						}
						//Else targetFontSize is within the accepted range and should be applied
						else{
							return cur.reduceFont(el);
						}
					}
				});

				//If all cells have more than maxPadding distance, expand font size until font-size is not scaled from base
				if(!resized && minDistance > options.maxPadding && $(el).data('reduceFactor') < 0){
					return this.growFont(el);
				}
			}

			//Else the table is split and detect if it's ready to be unsplit
			else{
				if($(window).width() > $(el).data('splitWidth')){
					return this.unsplitTable(el);
				}
			}

        },

     	reduceFont : function(el, options) {
			console.log("reduceFont");

			var currentReduce = $(el).data('reduceFactor');
			var newReduce = currentReduce - 1;

			$(el).removeClass("reduce" + currentReduce);
			$(el).data('reduceFactor', newReduce);
			$(el).addClass("reduce" + newReduce);

			//Don't attempt to increase size on this loop
			resized = true;

			return false;
        },

        growFont : function(el, options) {
        	console.log("growFont");
        	return false;
        },

        splitTable : function(el, options) {
        	console.log("splitTable");
        	return false;
        },

        unsplitTable : function(el, options) {
        	console.log("unsplitTable");
        	return false;
        }
    };


    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations and allowing any
    // public function (ie. a function whose name doesn't start
    // with an underscore) to be called via the jQuery plugin,
    // e.g. $(element).defaultPluginName('functionName', arg1, arg2)
    $.fn[pluginName] = function ( options ) {
        var args = arguments;
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new ResponsiveTable( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            return this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof ResponsiveTable && typeof instance[options] === 'function') {
                    instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
            });
        }
    }

})( jQuery, window, document );



