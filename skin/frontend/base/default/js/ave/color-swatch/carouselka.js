/**
 * Copyright (c) 2009 Victor Stanciu - http://www.victorstanciu.ro
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

Carouselka = Class.create(Abstract, {
    initialize: function (scrollerSelector, slideWrapperSelector, slideSelector, controlsSelector, options) {
        this.scrolling = false;
        this.scroller = $$(scrollerSelector)[0];
        this.wrapper = $$(slideWrapperSelector)[0];
        this.slideSelector = slideSelector;
        this.slides = $$(slideSelector);
        this.controlName = controlsSelector;
        this.controls = $$(controlsSelector);
        this.slideCount = this.slides.length;

        if (0 === this.slideCount) {
            return;
        }

        this.options = Object.extend({
            preloadImages: true,
            duration: 1,
            auto: false,
            frequency: 3,
            visibleSlides: 1,
            controlClassName: 'carousel-control',
            jumperClassName: 'carousel-jumper',
            disabledClassName: 'carousel-disabled',
            selectedClassName: 'carousel-selected',
            circular: true,
            wheel: false,
            effect: 'scroll',
            horizontal: true,
            initial: null,
            phaseDuration: 0.5,
            phaseOpacity: 0.3,
            transition: 'sinoidal',
            beforeMove: null,
            afterMove: null,
            autoSize: true,
            afterResize: null,
            slideWidth: null,
            slideHeight: null
        }, options || {});


        this.createAdditionalSlides();

        if (this.options.preloadImages) {
            this.preloadHtmlImages(this.slides[0].innerHTML, this.init.bind(this));
        } else {
            this.init();
        }
    },

    init: function () {
        this.initialUpdateSize();

        this.slides.each(function (slide, index) { slide._pcIndex = index; });

        if (this.slideCount > this.options.visibleSlides) {
            this.initEvents();

            if (this.options.auto) {
                this.start();
            }

            this.initInitial();
        } else {
            this.killPrev();
            this.killNext();
        }

        this.refreshControls(this.current ? this.current._pcIndex : 0);

        return this;
    },

    createAdditionalSlides: function () {
        var count = this.options.visibleSlides * 2 - 1;
        var i, idx;
        // append cloned slides to wrapper (show count )
        if (this.slideCount > this.options.visibleSlides && this.options.circular) {
            for (i = 0, idx = 0; i < count; ++i) {
                this.wrapper.appendChild(this.slides[idx].clone(true));
                if (++idx >= this.slideCount) {
                    idx = 0;
                }
            }
            this.slides = $$(this.slideSelector);
        }
    },

    initEvents: function () {
        if (this.controls) {
            this.controls.invoke('observe', 'click', this.click.bind(this));
        }

        if (this.options.auto) {
            this.scroller.observe('mouseenter', this.scrollerMouseEnter.bind(this));
            this.scroller.observe('mouseleave', this.scrollerMouseLeave.bind(this));
        }

        if (this.options.wheel) {
            this.scroller.observe('mousewheel', this.wheel.bindAsEventListener(this)).observe('DOMMouseScroll', this.wheel.bindAsEventListener(this));
        }
    },

    initInitial: function () {
        var initialIndex = 0;
        if (null != this.options.initial) {
            if (this.options.initial === 'last') {
                initialIndex = this.slideCount - 1;
            } else if ('number' === typeof this.options.initial) {
                initialIndex = this.options.initial;
            } else {
                initialIndex = this.slides.indexOf($(this.options.initial));
            }
            if (initialIndex < 0) {
                initialIndex = 0;
            } else if (initialIndex > this.slideCount) {
                initialIndex = this.slideCount - 1;
            }
            this.jumpTo(this.slides[initialIndex]);
        }
    },

    clearCache: function () {
        this.slides.forEach(function (slide) {
            delete slide._pcSlideHeight;
            delete slide._pcSlideWidth;
            delete slide._pcOffsetTop;
            delete slide._pcOffsetLeft;
        });
    },

    initialUpdateSize: function () {
        if (false == this.options.autoSize) {
            return this;
        }

        this.updateSize();

        if (this.options.afterResize) {
            this.options.afterResize.call(this);
        }

        return this;
    },

    updateSize: function () {
        if (false == this.options.autoSize) {
            return this;
        }

        this.clearCache();

        this.resumeAuto();

        var clientWidth = this.scroller.clientWidth;
        var clientHeight = this.scroller.clientHeight;
        var slideWidth = 0, slideHeight = 0;
        var slide = this.slides[0];
        var slideStyle;

        // normalize slide size
        if (this.options.horizontal) {
            slideWidth = Math.floor(clientWidth / this.options.visibleSlides);
            slideWidth = slideWidth
                - parseFloat(slide.getStyle('borderLeftWidth'))
                - parseFloat(slide.getStyle('borderRightWidth'))
                - parseFloat(slide.getStyle('marginLeft'))
                - parseFloat(slide.getStyle('marginRight'));
            slideStyle = {width: slideWidth + 'px'};
        } else {
            slideWidth = Math.floor(clientWidth);
            slideWidth = slideWidth
                - parseFloat(slide.getStyle('borderLeftWidth'))
                - parseFloat(slide.getStyle('borderRightWidth'))
                - parseFloat(slide.getStyle('marginLeft'))
                - parseFloat(slide.getStyle('marginRight'));
            slideStyle = {width: slideWidth + 'px'};
        }
        this.slides.each(function (slide) { slide.setStyle(slideStyle); });

        slideWidth = 0;
        slideHeight = 0;
        this.slides.slice(0, this.slideCount).forEach(function (slide) {
            var dimensions = slide.getDimensions();
            if (dimensions.width > slideWidth) slideWidth = dimensions.width;
            if (dimensions.height > slideHeight) slideHeight = dimensions.height;
        });
        if (this.options.horizontal) {
            slideStyle = {height: slideHeight + 'px'};
        } else {
            slideStyle = {height: slideHeight + 'px'};
        }
        this.slides.each(function (slide) { slide.setStyle(slideStyle); });

        // set scroller and wrapper size
        slideWidth = this.getSlideWidth(null, true);
        slideHeight = this.getSlideHeight(null, true);
        var slideSize = (this.options.horizontal) ? slideWidth : slideHeight;
        var wrapperSize = slideSize * this.slides.length;
        var scrollerSize = Math.floor(this.options.visibleSlides * slideSize);
        if (this.options.horizontal) {
            this.wrapper.setStyle({width: wrapperSize + 'px', height: slideHeight + 'px'});
            this.scroller.setStyle({width: scrollerSize + 'px', height: slideHeight + 'px'});
        } else {
            this.wrapper.setStyle({width: slideWidth + 'px', height: wrapperSize + 'px'});
            this.scroller.setStyle({width: slideWidth + 'px', height: scrollerSize + 'px'});
        }

        return this;
    },

    preloadHtmlImages: function (html, callback) {
        var self = this, i, count, loadingCount, loadCallback, sources, images = [];
        sources = this.extractHtmlImages(html);
        count = loadingCount = sources.length;
        if (count) {
            for (i = 0; i < count; i++) {
                images[i] = new Image();
                loadCallback = (function (index) {
                    return function () {
                        if (0 === --loadingCount) callback.call(self);
                    }
                })(i);
                images[i].onabort = loadCallback;
                images[i].onerror = loadCallback;
                images[i].onload = loadCallback;
                images[i].src = sources[i];
            }
        } else {
            callback.call(self);
        }
        return this;
    },

    extractHtmlImages: function (html) {
        var re, match, images = [];
        var trimQuotes = function trimQuotes(str) {
            return str.replace(/^["']+|["']+$/g, '');
        };
        // scr images
        re = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/ig;
        while (null !== (match = re.exec(html))) {
            images.push(match[1]);
        }
        // background images
        re = /background\s*:\s*url\(([^\)]+)\)/ig;
        while (null !== (match = re.exec(html))) {
            images.push(trimQuotes(match[1]));
        }
        return images;
    },

    getSlideWidth: function (slide, extended) {
        if (null == this.slideCount) {
            return 0;
        }

        if (this.options.slideWidth) {
            return this.options.slideWidth;
        }

        slide = slide || this.slides[0];
        var width = slide.getWidth();
        if (extended) {
            width = width
//            + parseFloat(slide.getStyle('borderLeftWidth'))
//            + parseFloat(slide.getStyle('borderRightWidth'))
                + parseFloat(slide.getStyle('marginLeft'))
                + parseFloat(slide.getStyle('marginRight'));
        }

        return width;
    },

    getSlideHeight: function (slide, extended) {
        if (null == this.slideCount) {
            return 0;
        }

        if (this.options.slideHeight) {
            return this.options.slideHeight;
        }

        slide = slide || this.slides[0];
        var height = slide.getHeight();
        if (extended) {
            height = height
//                + parseFloat(slide.getStyle('borderTopWidth'))
//                + parseFloat(slide.getStyle('borderBottomWidth'))
                + parseFloat(slide.getStyle('marginTop'))
                + parseFloat(slide.getStyle('marginBottom'));
        }
        return height;
    },

    getSlideOffsetLeft: function (slide) {
        if (this.options.slideWidth) {
            return slide._pcIndex * this.options.slideWidth;
        }

        if ('undefined' === typeof slide._pcOffsetLeft) {
            slide._pcOffsetLeft = this.getSlideListSize('width', this.slides.slice(0, slide._pcIndex));
        }
        return slide._pcOffsetLeft;
    },
    getSlideOffsetTop: function (slide) {
        if (this.options.slideHeight) {
            return slide._pcIndex * this.options.slideHeight;
        }

        if ('undefined' === typeof slide._pcOffsetTop) {
            slide._pcOffsetTop = this.getSlideListSize('height', this.slides.slice(0, slide._pcIndex));
        }
        return slide._pcOffsetTop;
    },


    getSlideListSize: function (name, slideList) {
        var size = 0;
        var cacheProp = 'height' === name ? '_pcSlideHeight' : '_pcSlideWidth';
        var method = 'height' === name ? this.getSlideHeight : this.getSlideWidth;
        slideList.forEach((function (slide) {
            if ('undefined' === typeof slide[cacheProp]) {
                slide[cacheProp] = method.call(this, slide, true);
            }
            size += slide[cacheProp];
        }).bind(this));
        return size;
    },

    scrollerMouseEnter: function () {
        if (this.options.auto) {
            this.pause();
        }
    },

    scrollerMouseLeave: function () {
        this.resumeAuto();
    },

    click: function (event) {
        this.stop();

        var element = event.findElement('a');

        if (!element.hasClassName(this.options.disabledClassName)) {
            if (element.hasClassName(this.options.controlClassName)) {
                eval("this." + element.rel + "()");
            } else if (element.hasClassName(this.options.jumperClassName)) {
                this.moveTo(element.rel);
                if (this.options.selectedClassName) {
                    this.controls.invoke('removeClassName', this.options.selectedClassName);
                    element.addClassName(this.options.selectedClassName);
                }
            }
        }

        if (element.rel != 'pause' && element.rel != 'resume') {
            this.deactivateControls();
        }

        event.stop();

        this.resumeAuto();
    },

    toggleJumpers: function (slide) {

        var buttons = $$('.' + this.options.jumperClassName);

        var selectedClassName = this.options.selectedClassName;

        buttons.each(function (button) {
            if (button.rel == slide.id) {
                button.addClassName(selectedClassName);
            } else {
                button.removeClassName(selectedClassName);
            }
        });

    },

    moveTo: function (element) {
        this.previous = this.current ? this.current : this.slides[0];
        this.current = $(element);

        this.toggleJumpers(this.current);

        if (this.options.beforeMove && (typeof this.options.beforeMove == 'function')) {
            this.options.beforeMove(this.previous);
        }

        this.previous.addClassName('outbound');
        this.current.removeClassName('outbound');

        if (this.scrolling) {
            this.scrolling.cancel();
        }

        var transition;
        switch (this.options.transition) {
            case 'spring':
                transition = Effect.Transitions.spring;
                break;
            case 'sinoidal':
            default:
                transition = Effect.Transitions.sinoidal;
                break;
        }

        switch (this.options.effect) {
            case 'fade':
                this.scrolling = new Effect.Opacity(this.scroller, {
                    from: 1.0,
                    to: 0,
                    duration: this.options.duration,
                    afterFinish: (function () {
                        if (this.options.horizontal) {
                            this.scroller.scrollLeft = this.getSlideOffsetLeft(this.current);
                        } else {
                            this.scroller.scrollTop = this.getSlideOffsetTop(this.current);
                        }

                        new Effect.Opacity(this.scroller, {
                            from: 0,
                            to: 1.0,
                            duration: this.options.duration,
                            afterFinish: (function () {
                                if (this.controls) {
                                    this.activateControls();
                                }
                                if (this.options.afterMove && (typeof this.options.afterMove == 'function')) {
                                    this.options.afterMove(this.current);
                                }
                            }).bind(this)
                        });
                    }).bind(this)
                });
                break;
            case 'phase':
                this.scrolling = new Effect.Opacity(this.scroller, {
                    from: 1.0,
                    to: this.options.phaseOpacity,
                    duration: this.options.phaseDuration,
                    afterFinish: (function () {
                        var effectOptions = {
                            duration: this.options.duration,
                            transition: transition,
                            afterFinish: (function () {
                                new Effect.Opacity(this.scroller, {
                                    from: this.options.phaseOpacity,
                                    to: 1.0,
                                    duration: this.options.phaseDuration,
                                    afterFinish: (function () {
                                        if (this.controls) {
                                            this.activateControls();
                                        }
                                        if (this.options.afterMove && (typeof this.options.afterMove == 'function')) {
                                            this.options.afterMove(this.current);
                                        }
                                    }).bind(this)
                                });
                            }).bind(this)
                        };
                        if (this.options.horizontal) {
                            effectOptions.x = this.getSlideOffsetLeft(this.current);
                        } else {
                            effectOptions.y = this.getSlideOffsetTop(this.current);
                        }
                        new Effect.SmoothScroll(this.scroller, effectOptions);
                    }).bind(this)
                });
                break;
            case 'scroll':
            default:
                var effectOptions = {
                    duration: this.options.duration,
                    transition: transition,
                    afterFinish: (function () {
                        if (this.controls) {
                            this.activateControls();
                        }
                        if (this.options.afterMove && (typeof this.options.afterMove == 'function')) {
                            this.options.afterMove(this.current);
                        }
                        this.scrolling = false;
                    }).bind(this)};
                if (this.options.horizontal) {
                    effectOptions.x = this.getSlideOffsetLeft(this.current);
                } else {
                    effectOptions.y = this.getSlideOffsetTop(this.current);
                }
                this.scrolling = new Effect.SmoothScroll(this.scroller, effectOptions);
                break;
        }
    },

    jumpTo: function (element) {
        element = $(element);

        if (this.scrolling) {
            this.scrolling.cancel();
        }

        if (this.options.horizontal) {
            this.scroller.scrollLeft = this.getSlideOffsetLeft(element);
        } else {
            this.scroller.scrollTop = this.getSlideOffsetTop(element);
        }
    },

    prev: function () {
        var currentIndex, prevIndex, rewind = false;
        currentIndex = this.current ? this.current._pcIndex : 0;
        prevIndex = currentIndex - this.options.visibleSlides;

        // check if we can make animation
        if (prevIndex < 0) {
            if (this.options.circular) {
                rewind = true;
                prevIndex = this.slideCount + prevIndex;
                currentIndex = prevIndex + this.options.visibleSlides;
            } else {
                prevIndex = 0;
            }
        }

        if (rewind && this.options.effect != 'fade') {
            this.jumpTo(this.slides[currentIndex]);
        }

        this.refreshControls(prevIndex);
        this.moveTo(this.slides[prevIndex]);
    },

    next: function () {
        var currentIndex, nextIndex, rewind = false;
        currentIndex = this.current ? this.current._pcIndex : 0;
        nextIndex = currentIndex + this.options.visibleSlides;
        // check if we can make animation
        if (nextIndex + this.options.visibleSlides > this.slides.length) {
            if (this.options.circular) {
                rewind = true;
                nextIndex -= this.slideCount;
                currentIndex = nextIndex - this.options.visibleSlides;
            } else {
                nextIndex = this.slides.length - this.options.visibleSlides;
                currentIndex = nextIndex - this.options.visibleSlides;
            }
        }

        if (rewind && this.options.effect != 'fade') {
            this.jumpTo(this.slides[currentIndex]);
        }

        this.refreshControls(nextIndex);
        this.moveTo(this.slides[nextIndex]);
    },

    first: function () {
        this.moveTo(this.slides[0]);
    },

    last: function () {
        this.moveTo(this.slides[this.slides.length - 1]);
    },

    toggle: function () {
        if (this.previous) {
            this.moveTo(this.slides[this.previous._pcIndex]);
        }
    },

    stop: function () {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    },

    start: function () {
        this.periodicallyUpdate();
    },

    pause: function () {
        this.stop();
        this.activateControls();
    },

    resume: function (event) {
        if (event) {
            var related = event.relatedTarget || event.toElement;
            if (!related || (!this.slides.include(related) && !this.slides.any(function (slide) {
                return related.descendantOf(slide);
            }))) {
                this.start();
            }
        } else {
            this.start();
        }
    },

    periodicallyUpdate: function () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.next();
        }
        this.timer = setTimeout(this.periodicallyUpdate.bind(this), this.options.frequency * 1000);
    },

    resumeAuto: function () {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        if (this.options.auto) {
            this.timer = setTimeout(this.periodicallyUpdate.bind(this), this.options.frequency * 1000);
        }
    },


    wheel: function (event) {
        event.cancelBubble = true;
        event.stop();

        var delta = 0;
        if (!event) {
            event = window.event;
        }
        if (event.wheelDelta) {
            delta = event.wheelDelta / 120;
        } else if (event.detail) {
            delta = -event.detail / 3;
        }

        if (!this.scrolling) {
            this.deactivateControls();
            if (delta > 0) {
                this.prev();
            } else {
                this.next();
            }
        }

        this.resumeAuto();

        return Math.round(delta); //Safari Round
    },

    deactivateControls: function () {
        this.controls.invoke('addClassName', this.options.disabledClassName);
    },

    refreshControls: function (slideIndex) {
        if (this.options.circular) {
            return;
        }

        if (slideIndex == 0) {
            this.killPrev();
        } else {
            this.restorePrev();
        }
        if (slideIndex >= this.slides.length - this.options.visibleSlides) {
            this.killNext();
        } else {
            this.restoreNext();
        }
    },
    killNext: function () {
        $$(this.controlName + '[rel="next"]').invoke('addClassName', 'control-dead');
    },
    killPrev: function () {
        $$(this.controlName + '[rel="prev"]').invoke('addClassName', 'control-dead');
    },
    restoreNext: function () {
        $$(this.controlName + '[rel="next"]').invoke('removeClassName', 'control-dead');
    },
    restorePrev: function () {
        $$(this.controlName + '[rel="prev"]').invoke('removeClassName', 'control-dead');
    },
    activateControls: function () {
        this.controls.invoke('removeClassName', this.options.disabledClassName);
    }
});


Effect.SmoothScroll = Class.create();
Object.extend(Object.extend(Effect.SmoothScroll.prototype, Effect.Base.prototype), {
    initialize: function (element) {
        this.element = $(element);
        var options = Object.extend({ x: 0, y: 0, mode: 'absolute', continuous: null }, arguments[1] || {});
        this.start(options);
    },

    setup: function () {
        if (this.options.continuous && !this.element._ext) {
            this.element.cleanWhitespace();
            this.element._ext = true;
            this.element.appendChild(this.element.firstChild);
        }

        this.originalLeft = this.element.scrollLeft;
        this.originalTop = this.element.scrollTop;

        if (this.options.mode == 'absolute') {
            this.options.x -= this.originalLeft;
            this.options.y -= this.originalTop;
        }
    },

    update: function (position) {
        this.element.scrollLeft = this.options.x * position + this.originalLeft;
        this.element.scrollTop = this.options.y * position + this.originalTop;
    }
});
