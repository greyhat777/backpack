if (typeof Ave == 'undefined') {
    var Ave = {};
}
Ave.ColorPicker = Class.create();
Ave.ColorPicker.prototype = {
    optionLabels: {},
    optionTitles: {},
    optionProductIDs: {},
    options: {},
    relativeOptions: {},
    choosedOptions: {},
    spConfig: {},
    defaultGallery: null,
    defaultGalleryMain: '',
    productImageGallerySelector: ".product-image-gallery",
    /** from block config */
    simpleProducts: [],
    zoomImages: [],
    currentSimpleProductId: null,
    currentImage: null,
    unavailableAttributes: [],
    allOptions: {},
    config: {},
    initialize: function (data, spConfig, config) {
        this.config = config.colorSwatch;
        if (config.zoom) {
            this.config.zoom = config.zoom;
        }
        this.initConfig(data, spConfig);
        this.setDefaults();
    },
    initConfig: function (data, spConfig) {
        if (typeof spConfig != 'undefined') {
            this.spConfig = spConfig;
            this.prepareSpConfig();
        }
        this.simpleProducts = data.simpleProducts;
        this.zoomImages = data.simpleProducts.zoomImages;
        this.initGallery();
    },
    initGallery: function () {
        if (!this.config || !this.config.gallerySelector) {
            return false;
        }
        var elements = $$(this.config.gallerySelector);
        if (elements.length) {
            this.defaultGallery = elements.first().innerHTML;
        }
        if ($$(".product-image-gallery").length) {
            this.defaultGalleryMain = $$(".product-image-gallery").first().innerHTML;
        }
    },
    findAssociatedProducts: function (type) {
        var attributeID;
        for (attributeID in this.spConfig.config.attributes) {
            var select = $$('#attribute' + attributeID).first();
            this.choosedOptions[attributeID] = select.getValue() == "" ? undefined : select.getValue();
            var anchor = $$("#" + attributeID + " #id" + this.choosedOptions[attributeID] + " a").first();
            if (typeof(anchor) != 'undefined' && type == 'active' && this.spConfig.isOptionsInUrl) {
                this.spConfig.isOptionsInUrl = false;
                anchor.click();
            }
        }
        var productIDs = [];
        for (attributeID in this.spConfig.config.attributes) {
            if (this.choosedOptions[attributeID] != 'undefined' &&
                (this.choosedOptions[attributeID] == parseInt(this.choosedOptions[attributeID]))) {
                if (productIDs.length > 0) {
                    productIDs = this.intersect(productIDs,
                        this.optionProductIDs[attributeID][this.choosedOptions[attributeID]]);
                } else {
                    productIDs = this.optionProductIDs[attributeID][this.choosedOptions[attributeID]];
                }
            }
        }
        this.currentSimpleProductId = productIDs[0] != null ? productIDs[0] : '';
        this.processFunction(type);
    },
    getAttributeIdByOptionId: function (optionId) {
        return $('id' + optionId).parentNode.className.match(/\d/g).join("");
    },
    getCorrectProductIdByOptionId: function (overOptionId, overAttributeId, relativeOptionId) {
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
            $$('.option-box.slide-item.active').each(function (element) {
                var optionId = element.id.replace(/[^\d.]/g, '');
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
        jQuery('#attribute' + overAttributeId).change();
        if (this.config.getSimpleImage != 1) {
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
        if (!productId)  {
            return false;
        }
        var swatchImg = $$('#id' + optionId + ' img').first();
        var toolTipImg = $$('#tooltip' + optionId + '-' + this.spConfig.config.productId + ' img').first();
        var productData = this.simpleProducts[productId];
        if (swatchImg != undefined && productData != undefined) {
            if (productData.thumbnail != '' && productData.thumbnail != undefined) {
                swatchImg.src = productData.thumbnail;
            }
            if (productData.tooltipImage != '' && productData.tooltipImage != undefined && toolTipImg != undefined) {
                toolTipImg.src = productData.tooltipImage;
            }
        }
    },
    initRelativeItems: function (element, module, activeOptionId, isActive) {
        var attributeId = element.parentNode.className.match(/\d/g);
        attributeId = attributeId.join("");
        module.changeSelect(attributeId, activeOptionId);
        if (!isActive) {
            element.removeClassName('no-relative', 'relative');
        }
        for (var i = 0; i < module.relativeOptions[activeOptionId].length; i++) {
            var relativeOptionId = module.relativeOptions[activeOptionId][i];
            var firstSwatch = $$('#id' + relativeOptionId).first();
            if (firstSwatch) {
                firstSwatch.addClassName('relative');
                module.changeOverRelativeImage(attributeId, activeOptionId, relativeOptionId);
            } else {
                $$('.super-attribute-select').each(function (selectElement) {
                    if (!selectElement.hasClassName('no-display')) {
                        var options = selectElement.options;
                        for (var j = 1; options.length > j; j++) {
                            if (!options[j].disabled && (options[j].value != relativeOptionId) && !options[j].hasClassName('relative')) {
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
        module.changeOverRelativeImage(attributeId, activeOptionId);
        $$('.option-box').each(function (e) {
            if (!e.hasClassName('relative') && !e.hasClassName(attributeId)) {
                e.addClassName('no-relative');
                if (isActive) {
                    e.addClassName('inactive');
                    var disableOptionId = e.id.replace(/[a-z]*/, '');
                    module.allOptions[disableOptionId].disabled = true;
                }
            }
        });
    },
    resetSwatches: function () {
        var module = this;
        $$('.x').each(function (e) {
            var attributeId = e.parentElement.parentElement.parentElement.id.replace(/[a-z]*/, '');
            if (module.unavailableAttributes.indexOf(attributeId) == -1) {
                e.style.display = 'none';
            }
        });
        $$('.option-box').each(function (e) {
            var attributeId = e.id.replace(/[a-z]*/, '');
            if (module.unavailableAttributes.indexOf(attributeId) == -1) {
                e.removeClassName('no-relative');
                e.removeClassName('relative');
                e.removeClassName('inactive');
            }
        });
    },
    configureOptions: function (e, type) {
        for (var optionValue in this.allOptions) {
            this.allOptions[optionValue].removeClassName('relative');
            this.allOptions[optionValue].disabled = false;
        }
        var activeOptions = $$('.option-box.active');
        var module = this;
        switch (type) {
            case null:
            case 'mouseOver':
                var optionId = e.id.replace(/[a-z-]*/, '');
                break;
            case 'active':
                optionId = '';
                break;
            default:
                optionId = '';
                if ('mouseout' == e) {
                    activeOptions.each(function (active) {
                        if ((' ' + active.className + ' ').indexOf(' active ') > -1) {
                            type = 'active';
                        }
                    });
                }
                break;
        }
        this.resetSwatches();
        if (optionId == '' && type == 'active') {
            if ($$('.option-box.active').length != 0) {
                activeOptions.each(function (active) {
                    var activeOptionId = active.id.replace(/[a-z-]*/, '');
                    module.initRelativeItems(active, module, activeOptionId, true);
                });
            }
        } else if (optionId != '' && type != 'active') {    //моусе овер
            var element = $$('#id' + optionId).first();
            this.initRelativeItems(element, this, optionId);
        }
        if ('mouseout' == e || (optionId == '' || type == 'active')) {
            for (var attributeId in this.spConfig.config.attributes) {
                if ($$('.' + attributeId + '.active').length == 0) {
                    this.changeSelect(attributeId, '');
                }
            }
        }
        this.findAssociatedProducts(type);
        $$('.no-relative .x').each(function (e) {
            e.style.display = 'block';
        });
    },
    changeSelect: function (attributeId, optionId) {
        if (this.spConfig.config.attributes[attributeId].isAveColorSwatch == 1) {
            if (!$$("select#attribute" + attributeId + " " + "option[value='" + optionId + "']").first().selected) {
                $$("select#attribute" + attributeId + " " + "option[value='" + optionId + "']").first().selected = true;
            }
            this.spConfig.configureElement($("attribute" + attributeId));
        }
    },
    prepareSpConfig: function () {
        if (this.spConfig.config.attributes != 'undefined') {
            for (var attributeID in this.spConfig.config.attributes) {
                this.optionLabels[attributeID] = {};
                this.optionProductIDs[attributeID] = {};
                this.optionTitles[attributeID] = this.spConfig.config.attributes[attributeID].label.toLowerCase();
                for (var optionID in this.spConfig.config.attributes[attributeID].options) {
                    var option = this.spConfig.config.attributes[attributeID].options[optionID];
                    if (typeof option == 'object') {
                        this.optionLabels[attributeID][option.id] = option.label.replace(/(^\s+)|(\s+$)/g, "").toLowerCase();
                        this.optionProductIDs[attributeID][option.id] = [];
                        this.options[option.id] = [];
                        for (var i = 0, productsLength = option.products.length; i < productsLength; i++) {
                            this.optionProductIDs[attributeID][option.id].push(option.products[i]);
                            this.options[option.id].push(option.products[i]);
                        }
                    }
                }
            }
        }
        for (var option in this.options) {
            if (this.options.hasOwnProperty(option) && this.options[option].length == 0) {
                this.unavailableAttributes.push(option);
            }
        }
        this.spConfig.unavailableAttributes = this.unavailableAttributes;
        this.prepareRelativeOptions();
    },
    prepareRelativeOptions: function () {
        for (var optionId in this.options) {
            this.relativeOptions[optionId] = [];
            for (var productId in this.options[optionId]) {
                for (var relativeOptionId in this.options) {
                    if (relativeOptionId != optionId) {
                        if (this.options[relativeOptionId].indexOf(this.options[optionId][productId]) != -1) {
                            this.relativeOptions[optionId].push(relativeOptionId);
                        }
                    }
                }
            }
        }
    },
    changeImages: function (currentData) {
        if (!this.config || !this.config.imageSelector) {
            return false;
        }
        if (currentData.image == ave_colorSwatch.currentImage) {
            return this;
        }
        var productImage = $$(this.config.imageSelector);
        if (productImage.length) {
            var image = productImage.first();
            if (currentData.image != '') {
                image.src = currentData.image;
            } else {
                image.src = this.config.defaultImage;
            }
        }
        var productGallery = $$(this.config.gallerySelector);
        if (productGallery.length) {
            var gallery = productGallery.first();
            if (currentData.imageGallery[0] && currentData.imageGallery[0]["thumbnail_urls"].length > 0) {
                gallery.update('');
                var i = 0;
                var prepareItem = this.config.galleryImageTemplate;
                var zoomImages = this.zoomImages;
                var configProductId = this.config.configProductId;
                currentData.imageGallery[0]["thumbnail_urls"].each(function () {
                    var item = ave_colorSwatch.imageTemplateReplace(prepareItem, configProductId, currentData.imageGallery[0], i, zoomImages);
                    gallery.insert(item);
                    i++
                });
            } else {
                gallery.update(this.defaultGallery);
            }
        }
    },
    changeDescriptions: function (currentData) {
        if (currentData.description && currentData.description.length > 0) {
            var description = $$(this.config.descriptionSelector);
            if (description.length) {
                description.each(function (e) {
                    e.update(currentData.description).show();
                });
            }
        }
        if (currentData.shortDescription && currentData.shortDescription.length > 0) {
            var shortDescription = $$(this.config.shortDescriptionSelector);
            if (shortDescription.length) {
                shortDescription.each(function (e) {
                    e.update(currentData.shortDescription).show();
                });
            }
        }
    },
    changeNames: function (currentData) {
        if (currentData.name && currentData.name.length > 0 && this.config && this.config.productNameSelector) {
            var name = $$(this.config.productNameSelector);
            if (name.length) {
                name.each(function (e) {
                    e.update(currentData.name).show();
                });
            }
        }
    },
    changeSkus: function (currentData) {
        if (currentData.sku && currentData.sku.length > 0 && this.config && this.config.productSkuSelector) {
            var sku = $$(this.config.productSkuSelector);
            if (sku.length) {
                sku.each(function (e) {
                    e.update(currentData.sku).show();
                });
            }
        }
    },

    initProductMediaManager: function (currentData) {
        if (typeof ProductMediaManager == "object") {
            if (currentData.image == ave_colorSwatch.currentImage) {
                return this;
            }
            $$(this.config.galleryImageSelector).each(function (e) {
                e.removeAttribute("onclick");
            });
            $$(".product-image-gallery .gallery-image").each(function (e) {
                if (e.id != "image-main") {
                    e.remove();
                }
            });
            if ($$(".product-image-gallery").length) {
                if (currentData.imageGallery[0] && currentData.imageGallery[0]["gallery_urls"].length > 0) {
                    var i = 0;
                    currentData.imageGallery[0]["gallery_urls"].each(function () {
                        var item = '<img id="image-%index%" class="gallery-image" data-zoom-image="%image%" src="%image%" alt="%alt%" title="%title%">';
                        item = item.replace('%image%', currentData.imageGallery[0]["gallery_urls"][i]);
                        item = item.replace('%image%', currentData.imageGallery[0]["gallery_urls"][i]);
                        item = item.replace('%alt%', currentData.imageGallery[0]["alts"][i]);
                        item = item.replace('%title%', currentData.imageGallery[0]["titles"][i]);
                        item = item.replace('%index%', i);
                        $$(".product-image-gallery")[0].insert(item);
                        i++
                    });
                } else {
                    $$(".product-image-gallery").first().update(this.defaultGalleryMain);
                }
                $$(".product-image .product-image-gallery .gallery-image").each(function (element) {
                    element.removeClassName("visible");
                });
                $$(this.config.imageSelector).each(function (element) {
                    element.addClassName("visible");
                });
            }
            ProductMediaManager.init();
        }
    },
    imageTemplateReplace: function (item, configProductId, imageGallery, i, zoomImages) {
        item = item.replace('%product_id%', configProductId);
        item = item.replace('%image%', imageGallery["gallery_urls"][i]);
        item = item.replace('%image%', imageGallery["gallery_urls"][i]);
        item = item.replace('%image%', imageGallery["gallery_urls"][i]);
        item = item.replace('%zoom_image%', zoomImages[imageGallery["gallery_urls"][i]]);
        item = item.replace('%thumbnail%', imageGallery["thumbnail_urls"][i]);
        item = item.replace('%alt%', imageGallery["alts"][i]);
        item = item.replace('%title%', imageGallery["titles"][i]);
        item = item.replace('%index%', i);
        return item;
    },
    initZoom: function (currentData) {
        if (typeof (this.config) != 'undefined' && typeof (this.config.zoom) != 'undefined') {
            if (currentData.image == ave_colorSwatch.currentImage) {
                return this;
            }
            if (this.config.zoom.zoomImageSelector && currentData.images && currentData.zoomImages[currentData.images[0]] != undefined) {

                var zoomImage = $$(defaultConfigs.zoom.zoomImageSelector);
                if (zoomImage.length) {
                    var img = zoomImage.first();
                    switch (img.tagName.toLowerCase()) {
                        case 'img':
                            img.src = currentData.zoomImages[currentData.images[0]];
                            break;
                        case 'a':
                            img.href = currentData.zoomImages[currentData.images[0]];
                            break;
                        default:
                            img.style.backgroundImage = "url('" + currentData.zoomImages[currentData.images[0]] + "')";
                    }
                }
            } else {
                if (this.config.zoom.zoomImageSelector) {
                    zoomImage = $$(this.config.zoom.zoomImageSelector);
                    if (zoomImage.length) {
                        img = zoomImage.first();
                        switch (img.tagName.toLowerCase()) {
                            case 'img':
                                img.src = defaultZoomImg;
                                break;
                            case 'a':
                                img.href = defaultZoomImg;
                                break;
                            default:
                                img.style.backgroundImage = "url('" + this.config.zoom.defaultZoomImg + "')";
                        }
                    }
                }
            }
            var elements = $$(this.config.zoom.gallerySelector);
            var configProductId = this.config.configProductId;
            if (elements.length) {
                var gallery = elements.first();
                if (currentData.imageGallery[0] && currentData.imageGallery[0]["thumbnail_urls"].length > 0) {
                    gallery.update("");
                    var i = 0;
                    var prepareItem = this.config.galleryImageTemplate;
                    var zoomImages = this.zoomImages;
                    currentData.imageGallery[0]["thumbnail_urls"].each(function () {
                        var item = ave_colorSwatch.imageTemplateReplace(prepareItem, configProductId, currentData.imageGallery[0], i, zoomImages);
                        gallery.insert(item);
                        i++
                    });
                } else {
                    gallery.update(this.defaultGallery);
                }
            }
            if ((typeof  document.prepareImagesList).toLocaleLowerCase() === 'function') {
                document.prepareImagesList();
            }
            if (typeof jQuery != "undefined" && typeof jQuery().CloudZoom != "undefined") {
                if ($$('.product-image .mousetrap').length) {
                    $$('.product-image .mousetrap').first().remove();
                }
                jQuery(this.config.zoom.zoomImageSelector + ', .cloud-zoom-gallery').CloudZoom();
                jQuery('a.cloud-zoom-gallery').first().click();
            }
        }
    },

    getAllOptions: function () {
        var module = this;
        var allSelects = $$('#' + this.spConfig.productId + ' select');
        allSelects.each(function (e) {
            var allOptions = e.select("option");
            allOptions.each(function (option) {
                var optionValue = option.value.toLowerCase();
                if (optionValue) {
                    module.allOptions[optionValue] = option;
                }
            });
        });
    },

    processFunction: function (type) {
        var simpleProductId = 'default';
        if (this.currentSimpleProductId != '') {
            simpleProductId = this.currentSimpleProductId;
        }
        var currentData = this.simpleProducts[simpleProductId];
        if (this.spConfig.defaultOptions.use_price_simple == '1') {
            //this.initSimplePrice(currentData);
        }
        this.changeImages(currentData);
        if (this.spConfig.defaultOptions.change_description == '1' && type == 'active') {
            this.changeDescriptions(currentData);
        }
        this.changeNames(currentData);
        this.changeSkus(currentData);
        this.initZoom(currentData);
        this.initProductMediaManager(currentData);
        this.initCloudZoom();
    },
    initSimplePrice: function (currentData) {
        /*  fix fo price from simple products */
        var price = $$('.product-shop .price-info .price');
        if (price.length) {
            price.each(function (e) {
                e.update(currentData.price).show();
            });
        }
    },
    setDefaults: function () {
        this.getAllOptions();
        Event.observe(window, 'load', (function () {
            for (var attributeID in this.spConfig.config.attributes) {
                $$('#attribute' + attributeID).invoke('observe', 'change', (function (event) {
                    var select = Event.element(event);
                    var attributeId = select.id.replace(/[a-z]*/, '');
                    $$('.' + attributeId).each(function (e) {
                        e.removeClassName('active');
                        e.removeClassName('inactive');
                    });
                    var liItem = $$('#id' + select.value).first();
                    if (liItem != undefined) {
                        liItem.addClassName('active');
                    } else {
                        $$(attributeId).each(function (e) {
                            e.removeClassName('active');
                            e.removeClassName('inactive');
                        });
                    }
                    this.spConfig.configureActive(null, 'active');
                }).bind(this));
            }
            this.findAssociatedProducts('active');
        }).bind(this));
    },
    initCloudZoom: function () {
        if (typeof jQuery != "undefined" && typeof jQuery().CloudZoom != "undefined") {
            if ($$('.product-image .mousetrap').length) {
                $$('.product-image .mousetrap').first().remove();
            }
            jQuery(this.config.zoomImageSelector + ', .cloud-zoom-gallery').CloudZoom();
        }
    },
    intersect: function (a, b) {
        var t;
        if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
        return a.filter(function (e) {
            if (b.indexOf(e) !== -1) return true;
        });
    }
};