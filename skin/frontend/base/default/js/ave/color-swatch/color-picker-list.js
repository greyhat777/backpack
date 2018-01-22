if (typeof Ave == 'undefined') {
    var Ave = {};
}
Ave.ColorPickerList = Class.create();
Ave.ColorPickerList.prototype = {
    optionLabels: {},
    optionTitles: {},
    optionProductIDs: {},
    choosedOptions: {},
    spConfig: {},
    productImage: null,
    defaultImage: '',
    buttonLabelAddToCart: '',
    relativeOptions: {},
    options: {},
    /** from block config */
    simpleProducts: {},
    getSimpleImage: null,
    allOptions: {},
    initialize: function (data, spConfig, buttonLabelAddToCart) {
        this.buttonLabelAddToCart = buttonLabelAddToCart;
        this.initConfig(data, spConfig);
        this.setDefaults();
    },
    initConfig: function (data, spConfig) {
        this.spConfig = spConfig;
        this.optionProductIDs = {};
        this.relativeOptions = {};
        this.options = {};
        this.prepareSpConfig();
        this.selectProductImage();
        this.getSimpleImage = data.getSimpleImage;
        this.simpleProducts = data.simpleProducts;
    },
    findAssociatedProducts: function (type) {
        for (var attributeID in this.spConfig.config.attributes) {
            var select = $$('.' + attributeID + '-' + this.spConfig.productId).first();
            this.choosedOptions[attributeID] = select.getValue() == "" ? undefined : select.getValue();
        }
        this.simpleProductIDs = [];
        for (attributeID in this.spConfig.config.attributes) {
            if (this.choosedOptions[attributeID] != 'undefined' &&
                (this.choosedOptions[attributeID] == parseInt(this.choosedOptions[attributeID]))) {
                if (this.simpleProductIDs.length > 0) {
                    this.simpleProductIDs =
                        this.intersect(
                            this.simpleProductIDs, this.optionProductIDs[attributeID][this.choosedOptions[attributeID]]);
                }
                else {
                    this.simpleProductIDs = this.optionProductIDs[attributeID][this.choosedOptions[attributeID]];
                }
            }
        }
        this.processFunction(this.simpleProductIDs[0], type);
    },
    prepareSpConfig: function () {
        for (var attributeID in this.spConfig.config.attributes) {
            this.optionLabels[attributeID] = {};
            this.optionProductIDs[attributeID] = {};
            var attribute = this.spConfig.config.attributes[attributeID];
            this.optionTitles[attributeID] = (attribute.label) ? attribute.label.toLowerCase() : '';

            for (var optionID in attribute.options) {
                var option = attribute.options[optionID];
                if (typeof option == 'object') {
                    this.optionLabels[attributeID][option.id] = option.label.replace(/(^\s+)|(\s+$)/g, "")/*.replace(/"/g, "'")*/.toLowerCase();
                    this.optionProductIDs[attributeID][option.id] = [];
                    this.options[option.id] = [];
                    for (var i = 0, productsLength = option.products.length; i < productsLength; i++) {
                        this.optionProductIDs[attributeID][option.id].push(option.products[i]);
                        this.options[option.id].push(option.products[i]);
                    }
                }
            }
        }
        this.prepareRelativeOptions();
    },
    prepareRelativeOptions: function () {
        for (var optionId in this.options) {
            this.relativeOptions[optionId] = [];
            for (var i = 0; i < this.options[optionId].length; i++) {
                for (var relativeOptionId in this.options) {
                    if (relativeOptionId != optionId) {
                        if (this.options[relativeOptionId].indexOf(this.options[optionId][i]) != -1) {
                            this.relativeOptions[optionId].push(relativeOptionId);
                        }
                    }
                }
            }
        }
    },
    configureOptions: function (e, type) {
        var productId = this.spConfig.productId;
        var allOptions = $$('#' + productId + ' option');
        allOptions.each(function (option) {
            option.disabled = false;
            option.removeClassName('relative');
        });
        var optionId = '', i;
        switch (type) {
            case null:
            case 'mouseOver':
                optionId = e.id.replace(/[a-z-]*/, '');
                if (type != 'active' && typeof (e) != 'undefined') {
                    var parentHolder = e.parentNode;
                    var attributeId = parentHolder.id.replace(/[a-z-]*/, '');
                    optionId = this.getOptionId(e.id.replace(/[a-z-]*/, ''));
                }
                break;
            case 'active':
                optionId = '';
                break;
            default:
                optionId = '';
                if ('mouseout' == e || 'mouseleave' == e) {
                    var swatches = $$('#' + productId + ' .active');
                    for(i = 0; swatches.length > i; i++) {
                        if ((' ' + swatches[i].className + ' ').indexOf(' active ') > -1) {
                            type = 'active';
                        }
                    }
                }
                break;
        }
        this.resetSwatches();
        if (optionId == '' && type == 'active') {
            if ($$('#' + productId + ' .active').length != 0) {
                this.configureActiveSwatches();
            }
        } else if (optionId != '' && type != 'active') {
            this.changeSelect(attributeId, optionId);
            e.removeClassName('no-relative');
            e.removeClassName('relative');
            for (i = 0; i < this.relativeOptions[optionId].length; i++) {
                this.changeOverRelativeImage(attributeId, optionId, this.relativeOptions[optionId][i]);
                var imageBox = $$('#colorpicker-images-box-' + this.relativeOptions[optionId][i] + '-' + productId);
                if (imageBox && imageBox.first()) {
                    imageBox.first().addClassName('relative');
                }
            }
            this.changeOverRelativeImage(attributeId, optionId);
            $$('#' + productId + ' .colorpicker-image-box').each(function (swatch) {
                if (swatch.parentNode != e.parentNode && !swatch.hasClassName('relative')) {
                    swatch.addClassName('no-relative');
                }
            });
        }
        if ('mouseout' == e || 'mouseleave' == e || type == 'active') {
            for (attributeId in this.spConfig.config.attributes) {
                if ($$('#colorpicker-box-' + attributeId + '-' + productId + ' .active').length == 0) {
                    this.changeSelect(attributeId + '-' + productId, '');
                }
            }
        }
        this.findAssociatedProducts(type);
        $$('#' + productId + ' .no-relative').each(function (e) {
            e.select('.x').first().style.display = 'block';
        });
    },
    changeSelect: function (attributeId, optionId) {
        if (this.spConfig.config.attributes[parseInt(attributeId)].isAveColorSwatch == 1) {
            if (!$$("select." + attributeId + " " + "option[value='" + optionId + "']").first().selected) {
                $$("select." + attributeId + " " + "option[value='" + optionId + "']").first().selected = true;
            }
            this.spConfig.configureElement($$("select." + attributeId).first());
        }
    },
    resetSwatches: function () {
        $$('#' + this.spConfig.productId + ' .x').each(function (e) {
            e.style.display = 'none';
        });
        $$('#' + this.spConfig.productId + ' .colorpicker-image-box').each(function (e) {
            e.removeClassName('no-relative');
            e.removeClassName('relative');
            e.removeClassName('inactive');
        });
    },
    selectProductImage: function () {
        var firstElement = $$('#' + this.spConfig.productId).first();
        if (!firstElement) {
            return false;
        }
        var parentHolder = firstElement.parentNode;
        while (parentHolder.tagName != 'LI') {
            parentHolder = parentHolder.parentNode
        }
        this.productImage = parentHolder.select('.product-image img');
        this.defaultImage = this.productImage.first().src;
    },
    changeImages: function (currentData) {
        var productImage = this.productImage;
        if (productImage.length) {
            var image = productImage.first();
            if (currentData.image != '') {
                image.src = currentData.image;
            } else {
                image.src = this.defaultImage;
            }
        }
    },
    changeDescriptions: function (currentData) {
        if (currentData.shortDescription && currentData.shortDescription.length > 0) {
            var shortDescription = $$('#' + this.spConfig.productId).first().parentNode.select('.desc');
            if (shortDescription.length) {
                shortDescription.each(function (e) {
                    e.update(currentData.shortDescription).show();
                });
            }
        }
    },
    changeName: function (currentData) {
        if (currentData.name && currentData.name.length > 0 && this.spConfig && this.spConfig.productNameSelector
            && this.spConfig.productChangeName) {
            var nameElement = null,
                holderName = $$('#' + this.spConfig.productId).first();
            for (var i = 0; i < 5; i++) {
                if (holderName.select(this.spConfig.productNameSelector).length > 0) {
                    nameElement = holderName.select(this.spConfig.productNameSelector);
                    break;
                } else {
                    holderName = holderName.parentNode;
                }
            }
            if (nameElement && nameElement.length) {
                nameElement.each(function (e) {
                    e.update(currentData.name).show();
                });
            }
        }
    },
    initSimplePrice: function (currentData) {
        /*  fix fo price from simple products */
        var priceSelector = '.price-box .price',
            priceElement = null,
            holderSelector = $$('#' + this.spConfig.productId).first();
        for (var i = 0; i < 5; i++) {
            if (holderSelector.select(priceSelector).length > 0) {
                priceElement = holderSelector.select(priceSelector);
                break;
            } else {
                holderSelector = holderSelector.parentNode;
            }
        }
        if (priceElement && priceElement.length) {
            priceElement.each(function (e) {
                e.update(currentData.price).show();
            });
        }
    },
    processFunction: function (currentSimpleProductId, type) {
        var simpleProductId = 'default';

        if (typeof currentSimpleProductId != 'undefined') {
            simpleProductId = currentSimpleProductId;
        }
        var currentData = this.simpleProducts[simpleProductId];

        switch (this.spConfig.mode) {
            case "grid":
                this.changeImages(currentData);
                break;
            case "list":
                this.changeImages(currentData);
                if (type == 'active')
                    this.changeDescriptions(currentData);
                break;
        }
        this.changeName(currentData);
        if (this.spConfig.usePriceSimple == '1') {
            this.initSimplePrice(currentData);
        }
    },
    configureActiveSwatches: function () {
        var productId = this.spConfig.productId;
        var activeOptions = $$('#' + productId + ' .active');
        var module = this;
        activeOptions.each(function (active) {
            var activeAttributeId = active.parentNode.id.replace(/[a-z-]*/, '');
            var activeOptionId = module.getOptionId(active.id.replace(/[a-z-]*/, ''));
            module.changeSelect(activeAttributeId, activeOptionId);
            for (var i = 0; i < module.relativeOptions[activeOptionId].length; i++) {
                var relativeId = module.relativeOptions[activeOptionId][i];
                var swatchFirst = $$('#colorpicker-images-box-' + relativeId + '-' + productId).first();
                if (swatchFirst) {
                    swatchFirst.addClassName('relative');
                    module.changeOverRelativeImage(activeAttributeId, activeOptionId, relativeId);
                } else {
                    $$('.super-attribute-select').each(function (selectElement) {
                        if (!selectElement.hasClassName('no-display')) {
                            var options = selectElement.options;
                            for (var j = 1; options.length > j; j++) {
                                if (!options[j].disabled && (options[j].value != relativeId) && !options[j].hasClassName('relative')) {
                                    options[j].writeAttribute('disabled');
                                } else {
                                    options[j].addClassName('relative');
                                    options[j].removeAttribute('disabled');
                                }
                            }
                        }
                    });
                }
            }
            module.changeOverRelativeImage(activeAttributeId, activeOptionId);
            $$('#' + productId + ' .colorpicker-image-box').each(function (swatch) {
                if (swatch.parentNode != active.parentNode && !swatch.hasClassName('relative')) {
                    swatch.addClassName('no-relative');
                    swatch.addClassName('inactive');
                    var disableAttributeId = swatch.parentNode.id.replace(/[a-z-]*/, '');
                    var disableOptionId = module.getOptionId(swatch.id.replace(/[a-z-]*/, ''));
                    $$("select." + disableAttributeId + " " + "option[value='" + disableOptionId + "']").first().disabled = true;
                }
            });
        });
    },
    getAttributeIdByOptionId: function (optionId) {
        var id = $('colorpicker-images-box-' + optionId + '-' + this.spConfig.productId).parentNode.id;
        return  parseInt(id.replace(/[a-z-]*/, ''));
    },
    getCorrectProductIdByOptionId: function (overOptionId, overAttributeId, relativeOptionId) {
        overAttributeId = parseInt(overAttributeId);
        var productId, overProductIds = this.optionProductIDs[overAttributeId][overOptionId];

        if (relativeOptionId != undefined && relativeOptionId) {
            var relativeAttributeId = this.getAttributeIdByOptionId(relativeOptionId), i, j, activeOptionId,
                relativeProductIds = this.optionProductIDs[relativeAttributeId][relativeOptionId];
            for (i = 0; i < overProductIds.length; i++) {
                for (j = 0; j < relativeProductIds.length; j++) {
                    if (overProductIds[i] == relativeProductIds[j]) {
                        return overProductIds[i];
                    }
                }
            }
        } else {
            var zz = this;
            $$('#' + this.spConfig.productId + ' .slide-item.colorpicker-image-box.active').each(function (element) {
                var optionId = parseInt(element.id.replace(/[a-z-]*/, ''));
                var attrId = zz.getAttributeIdByOptionId(optionId);
                if (attrId != overAttributeId) {
                    var productIds = zz.intersect(overProductIds, zz.optionProductIDs[attrId][optionId]);
                    if (productIds.length > 0) {
                        productId = productIds[0];
                    }
                }
            });
            if (productId) {
                return productId;
            }
            return overProductIds[0];
        }
        return null;
    },
    changeOverRelativeImage: function (overAttributeId, overOptionId, relativeOptionId) {
        if (this.getSimpleImage != 1) {
            return false;
        }
        var optionId, productId;
        if (relativeOptionId != undefined && relativeOptionId) {
            optionId = relativeOptionId;
            productId = this.getCorrectProductIdByOptionId(overOptionId, overAttributeId, relativeOptionId);
        } else {
            optionId = overOptionId;
            productId = this.getCorrectProductIdByOptionId(overOptionId, overAttributeId);
        }
        var swatchImg = $$('#colorpicker-images-box-' + optionId + '-' + this.spConfig.productId + ' img').first();
        var toolTipImg = $$('#tooltip' + optionId + '-' + this.spConfig.productId + ' img').first();
        var productData = this.simpleProducts[productId];
        if (swatchImg != undefined) {
            if (productData.thumbnail != '' && productData.thumbnail != undefined) {
                swatchImg.src = productData.thumbnail;
            }
            if (toolTipImg != undefined && productData.tooltipImage != '' && productData.tooltipImage != undefined) {
                toolTipImg.src = productData.tooltipImage;
            }
        }
    },
    setDefaults: function () {
        var productId = this.spConfig.productId;
        for (var attributeID in this.spConfig.config.attributes) {
            $$('.' + attributeID + '-' + productId).invoke('observe', 'change', (function (event) {
                var select = Event.element(event);
                var attributeId = select.id.replace(/[a-z]*/, '');
                $$('#colorpicker-box-' + attributeId + '-' + this.spConfig.productId + ' .slide-item').each(function (e) {
                    e.removeClassName('inactive');
                    e.removeClassName('active');
                });
                var swatch = $$('#colorpicker-images-box-' + select.value + '-' + this.spConfig.productId).first();
                if (swatch != undefined) {
                    swatch.addClassName('active');
                } else {
                    $$('#colorpicker-box-' + attributeId + '-' + this.spConfig.productId + ' .slide-item').each(function (e) {
                        e.removeClassName('inactive');
                        e.removeClassName('active');
                    });
                }
                this.spConfig.configureActive(null, 'active');
                this.findAssociatedProducts();
            }).bind(this));
        }
        document.observe('dom:loaded', function () {
            var element = $$('#' + productId).first();
            if (!element) {
                return false;
            }
            var button = element.parentNode.parentNode.select('button.btn-cart').first();       //1.8
            var buttonLabel;
            if (typeof (button) == 'undefined') {
                button = element.parentNode.parentNode.select('.actions a.button').first();     //1.9 - grid mode
                buttonLabel = button;
            } else {
                buttonLabel = button.select('span span').first();   //get span
            }
            if (typeof (button) == 'undefined') {
                button = element.parentNode.parentNode.select('.action a.button').first();     //1.9 - list mode
                buttonLabel = button;
            }
            if (typeof (button) != 'undefined') {
                var addToCartForm = $$('#product_addtocart_form_' + productId.replace(/[a-z]*/, '')).first();
                var productAddToCartForm = new VarienForm('product_addtocart_form_' + productId.replace(/[a-z]*/, ''));
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
                buttonLabel.innerHTML = this.buttonLabelAddToCart;
                button.onclick = function () {
                    addToCartForm.submit.click();
                    return false;
                };
            }
        }.bind(this));
    },
    intersect: function (a, b) {
        var t;
        if (b.length > a.length) {
            t = b;
            b = a;
            a = t
        }
        return a.filter(function (e) {
            if (b.indexOf(e) !== -1) return true;
        });
    },
    getOptionId: function (str) {
        var pos = str.indexOf('-');
        if ('-1' != pos) {
            str = str.substring(0, pos);
        }
        return str;
    }
};