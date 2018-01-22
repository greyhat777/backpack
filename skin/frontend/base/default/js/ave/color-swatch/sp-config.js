if (typeof Ave == 'undefined') {
    var Ave = {};
}
Ave.SpConfig = Class.create(Product.Config, {
    TYPE: {
        VIEW: 'view',
        LIST: 'list'
    },
    currentType: '',
    productId: '',
    optionsPerSlide: null,
    optionsPrice: {},
    defaultOptions: {},
    mode: '',
    isOptionsInUrl: false,
    swatchMouseOver: true,
    productChangeName: false,
    productNameSelector: null,
    productSkuSelector: null,
    unavailableProducts: null,
    unavailableAttribute: null,
    usePriceSimple: null,
    attrSmallIds: null,
    parentFillSelect: Product.Config.prototype.fillSelect,
    parentConfigureElement: Product.Config.prototype.configureElement,
    parentResetChildren: Product.Config.prototype.resetChildren,
    initialize: function (defaultOptions, config, optionsPrice, type, attrSmallIds, mode) {
        this.initOptions(defaultOptions, config, optionsPrice, type, attrSmallIds, mode);
        this.initValues(config);
        this.settings.each(function (element) {
            //Event.observe(element, 'change', this.configure.bind(this));
            var attributeId = element.id.replace(/[a-z]*/, '');
            if (attributeId && this.config.attributes[attributeId]) {
                element.config = this.config.attributes[attributeId];
                element.attributeId = attributeId;
                this.state[attributeId] = false;
            }
        }.bind(this));
        for (var i = this.settings.length - 1; i >= 0; i--) {
            this.fillSelect(this.settings[i]);
        }
        this.configureForValues();
        document.observe("dom:loaded", this.configureForValues.bind(this));
        document.observe("dom:loaded", this.initSwatchesByUrl.bind(this));
    },
    initSwatchesByUrl: function() {
        for (var i = this.settings.length - 1; i >= 0; i--) {
            this.settings[i].selectedIndex = 2;
            if (this.settings[i].selectedIndex !=0 && this.settings[i].value && jQuery('#id' + this.settings[i].value)) {
                jQuery('#id' + this.settings[i].value).addClass('active');
            }
        }
    },
    initOptions: function (defaultOptions, config, optionsPrice, type, attrSmallIds, mode) {
        this.defaultOptions = defaultOptions;
        this.optionsPrice = optionsPrice;
        this.productId = 'product' + optionsPrice.productId;
        this.settings = $$('#' + this.productId + ' .super-attribute-select');
        this.currentType = type || this.TYPE.VIEW;
        this.config = config;
        this.taxConfig = this.config.taxConfig;
        this.state = new Hash();
        this.mode = mode;
        this.priceTemplate = new Template(this.config.template);
        this.prices = config.prices;
        this.attrSmallIds = attrSmallIds;
    },
    initValues: function (config) {
        if (this.config.defaultValues) {
            this.values = config.defaultValues;
            this.isOptionsInUrl = true;
        }
        if (config.hasOwnProperty('swatchMouseOver')) {
            this.swatchMouseOver = config.swatchMouseOver;
        }
        if (config.hasOwnProperty('productNameSelector')) {
            this.productNameSelector = config.productNameSelector;
        }
        if (config.hasOwnProperty('usePriceSimple')) {
            this.usePriceSimple = config.usePriceSimple;
        }
        if (config.hasOwnProperty('productSkuSelector')) {
            this.productSkuSelector = config.productSkuSelector;
        }
        if (config.hasOwnProperty('productChangeName')) {
            this.productChangeName = config.productChangeName;
        }
        if (config.hasOwnProperty('unavailableProducts')) {
            this.unavailableProducts = config.unavailableProducts;
        }
        if (config.hasOwnProperty('unavailableAttribute')) {
            this.unavailableAttribute = config.unavailableAttribute;
        }
        var separatorIndex = window.location.href.indexOf('#');
        if (separatorIndex != -1) {
            var paramsStr = window.location.href.substr(separatorIndex + 1);
            var urlValues = paramsStr.toQueryParams();
            if (!this.values) {
                this.values = {};
            }
            for (var i in urlValues) {
                this.values[i] = urlValues[i];
            }
            this.isOptionsInUrl = true;
        }
        if (this.config.inputsInitialized) {
            this.values = {};
            this.settings.each(function (element) {
                if (element.value) {
                    var attributeId = element.id.replace(/[a-z]*/, '');
                    this.values[attributeId] = element.value;
                }
            }.bind(this));
        }
    },
    fillSelect: function (element) {
        switch (this.currentType) {
            case this.TYPE.LIST:
                this.fillListSelect(element);
                break;
            case this.TYPE.VIEW:
                this.fillViewSelect(element);
                break;
        }
    },
    fillListSelect: function (element) {
        var attributeId = element.id.replace(/[a-z]*/, '');
        var options = this.getAttributeOptions(attributeId);
        this.clearSelect(element);
        element.options[0] = new Option(this.config.chooseText, '');
        if (options) {
            var allOptions = document.createElement('div');
            allOptions = $(allOptions); // fix for IE
            allOptions.addClassName('colorpicker-box');
            allOptions.id = 'colorpicker-box-' + attributeId + '-' + this.productId;

            var index = 1;
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                var allowedProducts = option.products.clone();
                if (allowedProducts.size() > 0) {
                    if (this.config.attributes[attributeId].isAveColorSwatch == '1') {
                        allOptions.appendChild(this.createListBox(option));
                    }
                    option.allowedProducts = allowedProducts;
                    element.options[index] = new Option(this.getOptionLabel(option, option.price), option.id);
                    element.options[index].config = option;
                    index++;
                }
            }
            var holder = $$('#slider-container-' + attributeId + '-' + this.productId).first();
            if (holder == undefined) {
                return;
            }
            var liHolder = holder.parentElement;
            if (this.mode == 'grid') {
                while (liHolder.tagName != 'LI') {
                    liHolder = liHolder.parentElement;
                }
            } else if (this.mode == 'list') {
                while (liHolder.tagName != 'div' && !liHolder.hasClassName('product-secondary')) {
                    liHolder = liHolder.parentElement;
                }
            }
            var mainHolderWidth = liHolder.clientWidth - parseFloat(liHolder.getStyle('paddingLeft')) -
                parseFloat(liHolder.getStyle('paddingRight'));
            var optionBoxWidth = parseFloat(ave_colorSwatches.config.width) + 4;

            if (ave_colorSwatches.config.showSlider != '0' &&
                mainHolderWidth < optionBoxWidth * (parseFloat(options.length))) {
                var slider = aveGlobalFunctions.createSlider(attributeId + '-' + this.productId);
                var content = slider.select('.carousel-content').first();
                content.appendChild(allOptions);
                holder.insertBefore(slider, holder.firstChild);
                holder.insertBefore(aveGlobalFunctions.createNavControl('prev', 'list'), holder.firstChild);
                holder.insertBefore(aveGlobalFunctions.createNavControl('next', 'list'), holder.lastChild);
                this.optionsPerSlide = Math.floor((mainHolderWidth) / optionBoxWidth);
                var slideCount = this.optionsPerSlide - 1;
                var module = this;
                slider.setStyle({width: +(slideCount) * optionBoxWidth + 'px'});
                document.observe("dom:loaded", function () {
                    aveGlobalFunctions.initCarousel(attributeId + '-' + module.productId, slideCount);
                });
            } else {
                holder.insertBefore(allOptions, holder.firstChild);
            }
        }
    },
    fillViewSelect: function (element) {
        var attributeId = element.id.replace(/[a-z]*/, '');
        var options = this.getAttributeOptions(attributeId);
        var index = 1;
        var i;
        if (this.config.attributes[attributeId].isAveColorSwatch == 1) {
            if (options) {
                element.options[0] = new Option('', '');
                element.options[0].innerHTML = this.config.chooseText;

                var ulHolder = document.createElement('ul');
                ulHolder.className = 'colorpicker_attribute_' + attributeId
                    + ' attribute-list';
                for (i = 0; i < options.length; i++) {
                    ulHolder.appendChild(this.createListItem(options[i], attributeId).addClassName('slide-item'));
                    element.options[index] = new Option(this.getOptionLabel(options[i], options[i].price), options[i].id);
                    if (typeof options[i].price != 'undefined') {
                        element.options[index].setAttribute('price', options[i].price);
                    }
                    element.options[index].config = options[i];
                    index++;
                }
                var mainHolder = $$('#' + attributeId).first();
                if (!mainHolder) {
                    return false;
                }
                var mainHolderWidth = mainHolder.parentNode.clientWidth
                    - parseFloat(mainHolder.parentNode.getStyle('paddingLeft'))
                    - parseFloat(mainHolder.getStyle('paddingRight'));
                var liWidth = parseFloat(this.defaultOptions.swatch_width) + 6;

                if (this.defaultOptions.show_slider != '0' && mainHolderWidth < liWidth * options.length) {
                    mainHolder.insert(aveGlobalFunctions.createNavControl('prev', 'view'));
                    var slider = aveGlobalFunctions.createSlider(attributeId);
                    var content = slider.select('.carousel-content').first();
                    content.insert(ulHolder);
                    mainHolder.insert(slider);
                    mainHolder.insert(aveGlobalFunctions.createNavControl('next', 'view'));
                    this.optionsPerSlide = Math.floor((mainHolderWidth) / liWidth);
                    var slideCount = this.optionsPerSlide == 1 ? this.optionsPerSlide : this.optionsPerSlide - 1;
                    slider.setStyle({width: +(slideCount * liWidth) + 'px'});
                    document.observe("dom:loaded", function () {
                        aveGlobalFunctions.initCarousel(attributeId, slideCount);
                    });
                } else {
                    mainHolder.insertBefore(ulHolder, mainHolder.firstChild);
                }
                var lastContainer = document.createElement('div');
                lastContainer = $(lastContainer); // fix for IE
                lastContainer.setStyle({clear: 'both'});
                mainHolder.appendChild(lastContainer);
            }
        } else {
            this.clearSelect(element);
            element.options[0] = new Option('', '');
            element.options[0].innerHTML = this.config.chooseText;
            var prevConfig = false;
            if(element.prevSetting){
                prevConfig = element.prevSetting.options[element.prevSetting.selectedIndex];
            }
            if (options) {
                for (i = 0; i < options.length; i++) {
                    var allowedProducts = [];
                    if (prevConfig) {
                        for (var j = 0; j < options[i].products.length; j++) {
                            if (prevConfig.config.allowedProducts
                                && prevConfig.config.allowedProducts.indexOf(options[i].products[j]) > -1) {
                                allowedProducts.push(options[i].products[j]);
                            }
                        }
                    } else {
                        allowedProducts = options[i].products.clone();
                    }

                    if (allowedProducts.size() > 0) {
                        options[i].allowedProducts = allowedProducts;
                        element.options[index] = new Option(this.getOptionLabel(options[i], options[i].price), options[i].id);
                        if (typeof options[i].price != 'undefined') {
                            element.options[index].setAttribute('price', options[i].price);
                        }
                        element.options[index].config = options[i];
                        index++;
                    }
                }
            }
        }
    },
    createListBox: function (option) {
        var itemHolder = document.createElement('div');
        itemHolder.addClassName('slide-item');
        itemHolder.addClassName('colorpicker-image-box');
        itemHolder.id = 'colorpicker-images-box-' + option.id + '-' + this.productId;
        if (!aveGlobalFunctions.isTouchDevice()) {
            if (this.swatchMouseOver == 1) {
                itemHolder.observe('mouseenter', this.mouseOver.bind(this));
                itemHolder.observe('mouseleave', this.configureActive.bind(this, 'mouseleave'));
            }
        } else {
            itemHolder.observe('mouseenter', this.click.bind(this));
        }
        var xDiv = document.createElement('div');
        xDiv.addClassName('x');
        xDiv.innerHTML = 'X';
        var optionAnchor = document.createElement('a');
        optionAnchor.href = 'javascript:void(0);';
        optionAnchor.observe('click', this.click.bind(this));
        var imgContainer = document.createElement('div');
        imgContainer = $(imgContainer); // fix for IE
        imgContainer.addClassName('image-container');

        var label = document.createElement('span');
        label.addClassName('label');
        label.align = 'center';
        if (this.attrSmallIds) {
            label.innerHTML = option.label;
        } else {
            label.innerHTML = '&nbsp;';
        }
        label.style.color = '#' + this.returnOpposite(option.color);
        var image = document.createElement('img');
        if (option.listImage == null) {
            imgContainer.appendChild(label);
            if (option.color == 'FFFFFF') {
                itemHolder.setStyle({border: "1px solid #E4E4E4"});
            }
            imgContainer.style.background = '#' + option.color;
        } else {
            image = $(image); // fix for IE
            image.id = 'colorpicker-image-' + option.id + '-' + this.productId;
            image.src = option.listImage;
            image.addClassName('colorpicker-image');
            image.alt = option.label;
            image.title = option.label;
            imgContainer.appendChild(image);
        }
        optionAnchor.appendChild(imgContainer);
        itemHolder.appendChild(xDiv);
        itemHolder.appendChild(optionAnchor);
        var productId = this.productId;
        var usePriceSimple = this.usePriceSimple;
        if (ave_colorSwatches.config.showTooltip == '1' && !aveGlobalFunctions.isTouchDevice()) {
            option.labelWithPrice = this.getOptionLabel(option, option.price);
            document.observe("dom:loaded", function () {
                aveGlobalFunctions.addTooltip(option, 'tooltip-list', productId, usePriceSimple);
            });
        }
        return itemHolder;
    },
    configureElement: function (element) {
        this.reloadOptionLabels(element);
        if (element.value) {
            this.state[element.config.id] = element.value;
        } else {
            this.resetChildren(element);
        }
        this.reloadPrice();
    },
    reloadPrice: function () {
        var price = 0;
        var oldPrice = 0;
        for (var i = this.settings.length - 1; i >= 0; i--) {
            var selected = this.settings[i].options[this.settings[i].selectedIndex];
            if (selected.config) {
                price += parseFloat(selected.config.price);
                oldPrice += parseFloat(selected.config.oldPrice);
            }
        }

        var product = [];

        this.settings.each(function(element) {
            if(typeof element.options[element.selectedIndex].config != 'undefined') {
                if (product.length) {
                    product = product.intersect(element.options[element.selectedIndex].config.products).uniq();
                } else {
                    product = element.options[element.selectedIndex].config.products;
                }
            }
        });

        if(product && product.length && typeof priceConfig !== 'undefined') {
            var productId = product[0];
            if(priceConfig[productId]) {
                jQuery(priceConfig.priceClass).replaceWith(priceConfig[productId].priceBlockHtml);

                if(priceConfig[productId].tierPricesHtml) {
                    jQuery(priceConfig.tierPriceClass).remove();
                    jQuery('.price-info').append(priceConfig[productId].tierPricesHtml);
                }
            }

            var title = null;
            if (typeof priceConfig[productId].title !== 'undefined') {
                title = priceConfig[productId].title;
            }

            History.pushState(null, title, priceConfig[productId].url);
        } else {
            this.optionsPrice.changePrice('config', {'price': price, 'oldPrice': oldPrice});
            this.optionsPrice.reload();
        }
        return price;
    },
    createListItem: function (option, attributeId) {
        var productId = this.config.productId;
        var image = null;
        var xDiv = document.createElement('div');
        xDiv.addClassName('x');
        xDiv.innerHTML = 'X';
        var label = document.createElement('span');
        label.addClassName('label');
        label.align = 'center';
        label.setStyle({'font-size': "18px"});
        var isSmallSize = false;
        if (this.attrSmallIds) {
            var ids = this.attrSmallIds.split(",");
            for (var i = 0; i < ids.length; i++) {
                if (ids[i] == attributeId) {
                    label.innerHTML = this.getOptionLabel(option);
                    isSmallSize = true;
                }
            }
        }
        label.style.color = '#' + this.returnOpposite(option.color);
        if (option.image != null && !isSmallSize) {
            image = document.createElement('img');
            image = $(image); // fix for IE//
            image.src = option.image;
            image.alt = label.innerHTML;
            image.title = label.innerHTML;
        } else {
            image = "";
        }

        var swatchBox = document.createElement('div');
        swatchBox.addClassName('swatch-box');
        swatchBox.appendChild(xDiv);

        if (image == "") {
            swatchBox.appendChild(label);
            swatchBox.style.backgroundColor = '#' + option.color;
            if (option.color == 'FFFFFF') {
                swatchBox.setStyle({border: "1px solid #E4E4E4"});
            }
        } else {
            swatchBox.appendChild(image);
        }

        var optionAnchor = document.createElement('a');
        optionAnchor.id = 'id' + option.id + '-' + productId;
        optionAnchor.href = 'javascript:void(0);';
        optionAnchor.addClassName('selected-option');
        if (!aveGlobalFunctions.isTouchDevice()) {
            if (this.swatchMouseOver == 1) {
                optionAnchor.observe('mouseover', this.mouseOver.bind(this));
                optionAnchor.observe('mouseout', this.configureActive.bind(this, 'mouseout'));
            }
            optionAnchor.observe('click', this.click.bind(this));
        } else {
            optionAnchor.observe('click', this.clickMobile.bind(this));
        }
        optionAnchor.appendChild(swatchBox);

        var item = document.createElement('li');
        item.addClassName('option-box ' + attributeId);
        item.id = 'id' + option.id;
        item.appendChild(optionAnchor);
        if (option.products.length == 0) {
            item.addClassName('no-relative');
            item.addClassName('inactive');
            xDiv.style.display = 'block';
        }
        var usePriceSimple = this.usePriceSimple;
        if (this.defaultOptions.showTooltip == '1' && !aveGlobalFunctions.isTouchDevice()) {
            option.labelWithPrice = this.getOptionLabel(option, option.price);
            document.observe("dom:loaded", function () {
                aveGlobalFunctions.addTooltip(option, '', productId, usePriceSimple);
            });
        }
        return item;
    },
    mouseOver: function (event) {
        var e = Event.element(event);
        switch (this.currentType) {
            case 'view':
                if (e.tagName != 'LI') {
                    while (e.tagName != 'LI') {
                        e = e.parentElement;
                    }
                }
                break;
            case 'list':
                if (!e.hasClassName('slide-item')) {
                    while (!e.hasClassName('slide-item')) {
                        e = e.parentElement;
                    }
                }
                break;
        }
        this.configureSwatch(e, 'mouseOver');
    },
    clickMobile: function (event) {
        this.mouseOver(event);
        this.click(event);
    },
    click: function (event) {
        if (event.hasOwnProperty('isTrusted') && event.isTrusted == false) {
            return;
        }
        var e = Event.element(event);
        if (this.swatchMouseOver != 1) {
            this.mouseOver(event);
        }
        switch (this.currentType) {
            case 'view':
                if (e.tagName != 'LI') {
                    while (e.tagName != 'LI') {
                        e = e.parentElement;
                    }
                }
                var attributeId = e.parentNode.className.match(/\d/g);
                attributeId = attributeId.join("");
                if (e != undefined) {
                    if (!e.hasClassName('active')) {
                        $$('.option-box').each(function (option) {
                            if (!option.hasClassName('relative') || option.hasClassName(attributeId)) {
                                option.removeClassName('active');
                            }
                        });
                        e.addClassName('active');
                    } else {
                        e.removeClassName('active');
                    }
                }
                jQuery('#attribute' + attributeId).trigger("change");
                break;
            case 'list':
                if (e != undefined) {
                    while (!e.hasClassName('colorpicker-image-box')) {
                        e = e.parentElement;
                    }
                    if (!e.hasClassName('active')) {
                        $$('#' + this.productId + ' .colorpicker-image-box').each(function (option) {
                            if ((option.parentNode == e.parentNode.parentNode || option.parentNode == e.parentNode)) {
                                if (!option.hasClassName('relative')) {
                                    option.removeClassName('active');
                                }
                            } else if (!option.hasClassName('relative')) {
                                option.removeClassName('active');
                            }
                        });
                        e.addClassName('active');
                    } else {
                        e.removeClassName('active');
                    }
                }
                break;
        }
        this.configureActive(null, 'active');
    },
    configureActive: function (event, type) {
        this.configureSwatch(event, type);
    },
    configureSwatch: function (event, type) {
        switch (this.currentType) {
            case 'view':
                if (ave_colorSwatch != null && typeof(ave_colorSwatch) == 'object') {
                    ave_colorSwatch.configureOptions(event, type);
                }
                break;
            case 'list':
                if (ave_colorSwatches[this.productId.replace(/[a-z]*/, '')] != null &&
                    typeof(ave_colorSwatches[this.productId.replace(/[a-z]*/, '')]) == 'object') {
                    ave_colorSwatches[this.productId.replace(/[a-z]*/, '')].configureOptions(event, type);
                }
                break;
        }
    },
    returnOpposite: function (color) {
        function h2d(h) {
            return parseInt(h, 16);
        }
        if (!color) {
            color = '';
        }
        var main = h2d(color.substr(0, 2)) + h2d(color.substr(2, 2)) + h2d(color.substr(4, 2));
        return (main / 3 >= 128) ? '000000' : 'ffffff';
    }
});
