if (typeof Ave == 'undefined') {
    var Ave = {};
}
Ave.GlobalFunctions = Class.create();
Ave.GlobalFunctions.prototype = {
    productIds: [],
    sliders:[],
    initialize: function (showTooltip) {
        this.showTooltip = showTooltip;
        this.setDefault();
    },
    setDefault: function () {
        var module = this;
        document.observe('dom:loaded', function () {
            module.productIds.sort();
            for (var i = 0; i < module.productIds.length; i++) {
                var productId = module.productIds[i];
                var element = $$('#list-options-' + productId).first();
                var button = element.parentNode.parentNode.select('.btn-cart').first();
                if (typeof (button) != 'undefined') {
                    var addToCartForm = $$('#product_addtocart_form_' + productId).first();
                    var productAddToCartForm = new VarienForm('product_addtocart_form_' + productId);
                    productAddToCartForm.submit = function (button, url) {
                        if (this.validator.validate()) {
                            var form = this.form;
                            var oldUrl = form.action;

                            if (url) {
                                form.action = url;
                            }
                            var e = null;
                            try {
                                this.form.submit();
                            } catch (e) {
                            }
                            this.form.action = oldUrl;
                            if (e) {
                                throw e;
                            }

                            if (button && button != 'undefined') {
                                button.disabled = true;
                            }
                        }
                    }.bind(productAddToCartForm);

                    button.onclick = function () {
                        addToCartForm.submit.click();
                    };
                }
            }
        });
    },
    createLink: function (option) {
        var mainHolder = $$('#option' + option.id).first();
        if (mainHolder) {
            var separator = document.createElement('span');
            separator.innerHTML = '&nbsp';
            mainHolder.insertBefore(separator, mainHolder.firstChild);
            var link = document.createElement('a');
            link.addClassName('layered-option-link');
            link.href = option.url;
            var container = document.createElement('div');
            container.id = 'id' + option.id + '-';
            container.addClassName('layered-option');
            container.style.background = '#' + option.color;
            if (option.image) {
                var image = document.createElement('img');
                image.addClassName('layered-option');
                image.src = option.image;
                image.alt = option.label;
                container.appendChild(image);
            }
            link.appendChild(container);
            mainHolder.insertBefore(link, mainHolder.firstChild);
            if (typeof (ave_colorSwatches) != 'undefined' && ave_colorSwatches.config.showTooltip == '1' && !this.isTouchDevice()) {
                this.addTooltip(option, 'tooltip-list', '');
            }
        }
    },
    isTouchDevice: function () {
        var el = document.createElement('div');
        el.setAttribute('ontouchstart', 'return;');
        return typeof el.ontouchstart === "function";
    },
    addTooltip: function (option, type, productId, usePriceSimple) {
        if ($("tooltip" + option.id + '-' + productId) == undefined) {
            var tooltip = document.createElement("div");
            tooltip.id = 'tooltip' + option.id + '-' + productId;
            tooltip.addClassName('tooltip-box ' + type);
            if (usePriceSimple == '1') {
                tooltip.innerHTML = option.label;
            } else {
                tooltip.innerHTML = option.labelWithPrice ? option.labelWithPrice : option.label;
            }

            var tooltipBox = document.createElement("div");
            tooltipBox.addClassName('tooltip-container');

            if (option.image != null) {
                var tooltipImage = document.createElement('img');
                tooltipImage.alt = option.label;
                if(type != 'tooltip-list'){
                    tooltipImage.src = option.popupImage ? option.popupImage : option.image;
                } else {
                    if (option.listPopupImage) {
                        tooltipImage.src = option.listPopupImage;
                    } else {
                        tooltipImage.src = option.popupImage ? option.popupImage : option.image;
                    }
                }
                tooltipBox.appendChild(tooltipImage);
            } else {
                tooltipBox.style.backgroundColor = "#" + option.color;
            }
            tooltip.appendChild(tooltipBox);
            tooltip.hide();
            document.body.appendChild(tooltip);
            var tooltipSelector = 'tooltip' + option.id + '-' + productId;
            if (type == 'tooltip-list') {
                if (productId != '' && productId != 'custom-id-') {
//                  tooltip selectors for product option on category page
                    var holderSelector = 'colorpicker-images-box-' + option.id + '-' + productId;
                } else if (productId == 'custom-id-') {
//                  tooltip selectors  for product custom option on category page
                    holderSelector = productId + option.id + ' div.img-container';
                } else {
//                  tooltip selectors  for option in layered navigation on category page
                    holderSelector = 'id' + option.id + '-';
                    tooltipSelector = 'tooltip' + option.id + '-';
                }
            } else {
                if (productId == 'custom-id-') {
//                  tooltip selectors  for product custom option on product page
                    holderSelector = productId + option.id + ' div.img-container';
                } else {
//                  tooltip selectors  for product option on product page
                    holderSelector = 'id' + option.id + '-' + productId;
                }
            }
            new Ave.Tooltip($$('#'+holderSelector).first(), tooltipSelector);
        }
    },
    createNavControl: function (type, pageType) {
        var arrowRelation = type == 'prev' ? 'left' : 'right';
        var item = document.createElement('div');
        item.addClassName(pageType);
        item.addClassName('arrow');
        item.addClassName(arrowRelation);

        var anchor = document.createElement('a');
        anchor.className = "carousel-control " + type;
        anchor.rel = type;
        anchor.href = "javascript:";

        if (type == 'prev') {
            anchor.innerHTML = '&lsaquo;';
        } else
            anchor.innerHTML = '&rsaquo;';
        item.appendChild(anchor);
        return item;
    },
    createSlider: function (sliderId) {
        var slider = document.createElement('div');
        slider.id = 'slider' + sliderId;
        slider.className = 'slider carousel default';
        var carousel = document.createElement('div');
        carousel.className = 'carousel-wrapper';
        var carouselBody = document.createElement('div');
        carouselBody.className = 'carousel-content';
        carousel.appendChild(carouselBody);
        slider.appendChild(carousel);
        return slider;
    },
    initCarousel: function (sliderId, slideCount) {
        var sliderSelector = '#slider' + sliderId;
        this.sliders[sliderId] = new Carouselka(
            sliderSelector + ' .carousel-wrapper',
            sliderSelector + ' .carousel-content',
            sliderSelector + ' .slide-item',
            '#slider-container-' + sliderId + ' a.carousel-control',
            {
                initial: 0,
                autoSize: false,
                horizontal: true,
                duration: 0.5,
                circular: false,
                visibleSlides: slideCount,
                afterResize: function () {
                    $('slider' + sliderId).setStyle({visibility: "visible"});
                    var scrollerWidth = this.scroller.getWidth();
                    $(this.scroller.parentNode).setStyle({width: scrollerWidth + 'px'});
                }
            }
        );
    }
};
