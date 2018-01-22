<?php

class Ave_ColorSwatch_Helper_Config extends Mage_Core_Helper_Abstract
{
    const CONFIG_TAB_PATH = 'ave_color_swatch/product_view_group/';
    const STYLE_TAB_PATH = 'ave_color_swatch/style_settings/';
    const LIST_TAB_PATH = 'ave_color_swatch/product_list_group/';
    const DEVELOPER_TAB_PATH = 'ave_color_swatch/developer_tools/';

    protected $_prices = array();
    protected $_tagInfoModel;
    protected $_product;
    protected $_allowedProducts;
    protected $_allowedAttributes;
    protected $_options;
    protected $_modelOption;
    protected $_unavailableProducts = array();

    public function setProduct($product)
    {
        $this->_product = $product;
        return $this;
    }

    public function  getProduct()
    {
        return $this->_product;
    }

    /**
     * Get allowed attributes
     *
     * @return array
     */
    protected function getAllowAttributes()
    {
        return $this->getProduct()->getTypeInstance(true)
            ->getConfigurableAttributes($this->getProduct());
    }

    /**
     * Get Allowed Products
     *
     * @return array
     */
    protected function getAllowProducts()
    {
        $products = array();
        $allProducts = $this->getProduct()->getTypeInstance(true)->getUsedProducts(null, $this->getProduct());
        foreach ($allProducts as $product) {
            $p = Mage::getModel('catalog/product')->load($product->getId());
            if (($p->getData('status') == Mage_Catalog_Model_Product_Status::STATUS_ENABLED)) {
                $products[] = $p;
            }
        }
        return $products;
    }

    /**
     * retrieve current store
     *
     * @return Mage_Core_Model_Store
     */
    public function getCurrentStore()
    {
        return Mage::app()->getStore();
    }

    /**
     * @param Mage_Catalog_Model_Product $_product
     *
     * @return string
     */
    public function getJsonConfig($_product)
    {
        $this->setProduct($_product);
        $this->_tagInfoModel = Mage::getModel('ave_colorswatch/attribute');
        $this->_modelOption = Mage::getModel('ave_colorswatch/option');

        $attributes = array();
        $currentProduct = $this->getProduct();
        $preconfiguredFlag = $currentProduct->hasPreconfiguredValues();

        if ($preconfiguredFlag) {
            $preconfiguredValues = $currentProduct->getPreconfiguredValues();
            $defaultValues = array();
        }

        $this->_allowedProducts = $this->getAllowProducts();
        $this->_allowedAttributes = $this->getAllowAttributes();
        $this->_options = $this->getOptions4AllowedProducts();

        foreach ($this->_allowedAttributes as $attribute) {
            $productAttribute = $attribute->getProductAttribute();
            $attributeId = $productAttribute->getId();
            $info = $this->prepareInfo4Attribute($attribute);
            if ($this->_validateAttributeInfo($info)) {
                $attributes[$attributeId] = $info;
            }
            if ($preconfiguredFlag) {
                $configValue = $preconfiguredValues->getData('super_attribute/' . $attributeId);
                if ($configValue) {
                    $defaultValues[$attributeId] = $configValue;
                }
            }
        }
        $config = $this->prepareMainConfig($attributes);
        if ($preconfiguredFlag && !empty($defaultValues)) {
            $config['defaultValues'] = $defaultValues;
        }
        $config['swatchMouseOver'] = $this->getDevConfig('swatch_mouse_over');
        $config['unavailableProducts'] = $this->_unavailableProducts;
        $config['productChangeName'] = $this->getListConfig('product_change_name');
        $config['productNameSelector'] = $this->getDevConfig('product_name_selector_list');
        $config['usePriceSimple'] = $this->getDevConfig('use_price_simple');
        $config['productSkuSelector'] = $this->getDevConfig('product_sku_selector');
        return Mage::helper('core')->jsonEncode($config);
    }

    protected function prepareInfo4Attribute($attribute)
    {
        $currentProduct = $this->getProduct();
        $productAttribute = $attribute->getProductAttribute();
        $attributeId = $productAttribute->getId();
        $tagInfoObject = $this->_tagInfoModel->load($attributeId);
        $isColorPicker = $tagInfoObject->getData(Ave_ColorSwatch_Model_Observer::IS_COLOR_SWATCH);
        $info = array(
            'id'               => $productAttribute->getId(),
            'code'             => $productAttribute->getAttributeCode(),
            'label'            => $attribute->getLabel(),
            'isAveColorSwatch' => $isColorPicker,
            'options'          => array()
        );
        $optionsConfig = array();
        if ($isColorPicker) {
            $optionsConfig = $this->getOptionsImages($attributeId);
        }
        $optionPrices = array();
        $prices = $attribute->getPrices();
        if (is_array($prices)) {
            foreach ($prices as $value) {
                if (!$this->_validateAttributeValue($attributeId, $value, $this->_options)) {
                    continue;
                }
                $currentProduct->setConfigurablePrice(
                    $this->_preparePrice($value['pricing_value'], $value['is_percent'])
                );
                $currentProduct->setParentId(true);
                Mage::dispatchEvent(
                    'catalog_product_type_configurable_price',
                    array('product' => $currentProduct)
                );
                $configurablePrice = $currentProduct->getConfigurablePrice();
                $indexVal = $this->_options[$attributeId][$value['value_index']];
                $productsAvailableIndex = array();
                if (isset($indexVal)) {
                    $productsIndex = $indexVal;
                    if (is_array($indexVal) && !empty($this->_unavailableProducts)) {
                        foreach ($indexVal as $index => $val) {
                            if (in_array($val, $this->_unavailableProducts)) {
                                unset($indexVal[$index]);
                            }
                        }
                    } else {
                        if (in_array($indexVal, $this->_unavailableProducts)) {
                            $indexVal = array();
                        }
                    }
                    foreach ($indexVal as $index => $val) {
                        $productsAvailableIndex[] = $val;
                    }
                } else {
                    $productsIndex = array();
                }
                $mainInfo = array(
                    'id'       => $value['value_index'],
                    'label'    => $value['label'],
                    'price'    => $configurablePrice,
                    'oldPrice' => $this->_prepareOldPrice($value['pricing_value'], $value['is_percent']),
                    'products' => $productsAvailableIndex,
                );
                if ($isColorPicker) {
                    $simpleImage = null;
                    $listImage = null;
                    $popupImage = null;
                    $listPopupImage = null;
                    if(1 == (int)Mage::helper('ave_colorswatch/config')->getDevConfig('get_simple_image') && !empty($productsIndex)){
                        $simpleProductId = $productsIndex[0];
                        $simpleProduct = Mage::getModel('catalog/product')->load($simpleProductId);
                        if ($simpleProduct->getImage() != null && $simpleProduct->getImage() != "no_selection") {
                            $simpleImage = Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                                $simpleProduct->getImage(),
                                $attributeId,
                                Mage::helper('ave_colorswatch/image')->getProductSwatchWidth(),
                                Mage::helper('ave_colorswatch/image')->getProductSwatchHeight());

                            $listImage = Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                                $simpleProduct->getImage(),
                                $attributeId,
                                Mage::helper('ave_colorswatch/image')->getProductListSwatchWidth(),
                                Mage::helper('ave_colorswatch/image')->getProductListSwatchHeight());

                            $popupImage = Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                                $simpleProduct->getImage(),
                                $attributeId,
                                Mage::helper('ave_colorswatch/image')->getProductPopupSwatchWidth(Ave_ColorSwatch_Helper_Data::TYPE_VIEW),
                                Mage::helper('ave_colorswatch/image')->getProductPopupSwatchHeight(Ave_ColorSwatch_Helper_Data::TYPE_VIEW));

                            $listPopupImage = Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                                $simpleProduct->getImage(),
                                $attributeId,
                                Mage::helper('ave_colorswatch/image')->getProductPopupSwatchWidth(Ave_ColorSwatch_Helper_Data::TYPE_LIST),
                                Mage::helper('ave_colorswatch/image')->getProductPopupSwatchHeight(Ave_ColorSwatch_Helper_Data::TYPE_LIST)  );
                        }
                    }
                    $additionalInfo = array(
                        'image'          => $simpleImage ? (string)$simpleImage : $optionsConfig['images'][$value['value_index']],
                        'listImage'      => $listImage ? (string)$listImage : $optionsConfig['listImages'][$value['value_index']],
                        'color'          => $optionsConfig['colors'][$value['value_index']],
                        'popupImage'     => $popupImage ? (string)$popupImage : $optionsConfig['tooltipImages'][$value['value_index']],
                        'listPopupImage' => $listPopupImage ? (string)$listPopupImage : $optionsConfig['tooltipImagesList'][$value['value_index']],
                    );
                } else {
                    $additionalInfo = array();
                }
                $info['options'][] = array_merge($mainInfo, $additionalInfo);
                $optionPrices[] = $configurablePrice;
            }
        }
        foreach ($optionPrices as $optionPrice) {
            foreach ($optionPrices as $additional) {
                $this->_preparePrice(abs($additional - $optionPrice));
            }
        }
        return $info;
    }

    protected function getOptions4AllowedProducts()
    {
        $options = array();
        foreach ($this->_allowedProducts as $product) {
            $productId = $product->getId();
            foreach ($this->_allowedAttributes as $attribute) {
                $productAttribute = $attribute->getProductAttribute();
                $productAttributeId = $productAttribute->getId();
                $attributeValue = $product->getData($productAttribute->getAttributeCode());
                if (!isset($options[$productAttributeId])) {
                    $options[$productAttributeId] = array();
                }
                if (!isset($options[$productAttributeId][$attributeValue])) {
                    $options[$productAttributeId][$attributeValue] = array();
                }
                $options[$productAttributeId][$attributeValue][] = $productId;
                if (!$product->isSalable()) {
                    $this->_unavailableProducts[] = $productId;
                }
            }
        }
        if (!empty($this->_unavailableProducts)) {
            $this->_unavailableProducts = array_unique($this->_unavailableProducts);
        }
        return $options;
    }

    protected function prepareMainConfig($attributes)
    {
        $taxHelper = Mage::helper('tax');
        $store = $this->getCurrentStore();

        $currentProduct = $this->getProduct();
        $taxCalculation = Mage::getSingleton('tax/calculation');
        if (!$taxCalculation->getCustomer() && Mage::registry('current_customer')) {
            $taxCalculation->setCustomer(Mage::registry('current_customer'));
        }

        $_request = $taxCalculation->getRateRequest(false, false, false);
        $_request->setProductClassId($currentProduct->getTaxClassId());
        $defaultTax = $taxCalculation->getRate($_request);

        $_request = $taxCalculation->getRateRequest();
        $_request->setProductClassId($currentProduct->getTaxClassId());
        $currentTax = $taxCalculation->getRate($_request);

        $taxConfig = array(
            'includeTax'     => $taxHelper->priceIncludesTax(),
            'showIncludeTax' => $taxHelper->displayPriceIncludingTax(),
            'showBothPrices' => $taxHelper->displayBothPrices(),
            'defaultTax'     => $defaultTax,
            'currentTax'     => $currentTax,
            'inclTaxTitle'   => Mage::helper('catalog')->__('Incl. Tax')
        );

        $config = array(
            'attributes' => $attributes,
            'template'   => str_replace('%s', '#{price}', $store->getCurrentCurrency()->getOutputFormat()),
            'basePrice'  => $this->_registerJsPrice($this->_convertPrice($currentProduct->getFinalPrice())),
            'oldPrice'   => $this->_registerJsPrice($this->_convertPrice($currentProduct->getPrice())),
            'productId'  => $currentProduct->getId(),
            'chooseText' => Mage::helper('catalog')->__('Choose an Option...'),
            'taxConfig'  => $taxConfig
        );
        return $config;
    }

    /**
     * Validating of super product option value
     *
     * @param int $attributeId
     * @param array $value
     * @param array $options
     * @return boolean
     */
    protected function _validateAttributeValue($attributeId, &$value, &$options)
    {
        if (isset($options[$attributeId][$value['value_index']])) {
            return true;
        }
        return false;
    }

    /**
     * Validation of super product option
     *
     * @param array $info
     * @return boolean
     */
    protected function _validateAttributeInfo($info)
    {
        if (count($info['options']) > 0) {
            return true;
        }
        return false;
    }

    /**
     * Calculation real price
     *
     * @param float $price
     * @param bool $isPercent
     * @return mixed
     */
    protected function _preparePrice($price, $isPercent = false)
    {
        if ($isPercent && !empty($price)) {
            $price = $this->getProduct()->getFinalPrice() * $price / 100;
        }

        return $this->_registerJsPrice($this->_convertPrice($price, true));
    }

    /**
     * Calculation price before special price
     *
     * @param float $price
     * @param bool $isPercent
     * @return mixed
     */
    protected function _prepareOldPrice($price, $isPercent = false)
    {
        if ($isPercent && !empty($price)) {
            $price = $this->getProduct()->getPrice() * $price / 100;
        }

        return $this->_registerJsPrice($this->_convertPrice($price, true));
    }

    /**
     * Replace ',' on '.' for js
     *
     * @param float $price
     * @return string
     */
    protected function _registerJsPrice($price)
    {
        return str_replace(',', '.', $price);
    }

    /**
     * Convert price from default currency to current currency
     *
     * @param float $price
     * @param boolean $round
     * @return float
     */
    protected function _convertPrice($price, $round = false)
    {
        if (empty($price)) {
            return 0;
        }

        $price = $this->getCurrentStore()->convertPrice($price);
        if ($round) {
            $price = $this->getCurrentStore()->roundPrice($price);
        }

        return $price;
    }

    public function getDefaultOptions($product)
    {
        $imageHelper = Mage::helper('catalog/image');
        $imageHelper->init($product, 'image');
        $coreHelper = Mage::helper('core');
        return $coreHelper->jsonEncode(array(
                'default_image'      => (string)$imageHelper->init($product, 'image'),
                'mediaupdate_url'    => Mage::getUrl('mediaupdate'),
                'swatch_width'       => $this->getStyleValue('swatch_width'),
                'swatch_height'      => $this->getStyleValue('swatch_height'),
                'tooltip_width'      => $this->getConfigValue('product_tooltip_width'),
                'tooltip_height'     => $this->getConfigValue('product_tooltip_height'),
                'show_slider'        => $this->getConfigValue('product_show_slider'),
                'showTooltip'        => $this->getConfigValue('product_show_tooltip'),
                'change_description' => $this->getConfigValue('product_change_description'),
                'use_price_simple'   => $this->getDevConfig('use_price_simple'),
            )
        );
    }

    public function getConfig($configTypes, $product)
    {
        if (empty($configTypes)) {
            return null;
        } else {
            $configs = array();
            $coreHelper = Mage::helper('core');
        }
        $configZoomTabPath = 'ave_zoom/zoom_group/';
        $zoomOptions = array(
            'zoomBoxHeight'  => Mage::getStoreConfig($configZoomTabPath . 'zoom_popup_height'),
            'zoomBoxWidth'   => Mage::getStoreConfig($configZoomTabPath . 'zoom_popup_width'),
            'zoomScale'      => Mage::getStoreConfig($configZoomTabPath . 'zoom_scale'),
        );
        foreach ($configTypes as $type) {
            switch ($type) {
                case 'colorSwatch':
                    $imageHelper = Mage::helper('catalog/image');
                    $configs[$type] = array(
                        'defaultImage'             => (string)$imageHelper->init($product, 'image'),
                        'shortDescriptionSelector' => $this->getDevConfig('short_description_selector'),
                        'descriptionSelector'      => $this->getDevConfig('description_selector'),
                        'galleryImageTemplate'     => preg_replace(
                            "~\n|\r~",
                            '',
                            $this->getDevConfig('gallery_image_template')
                        ),
                        'configProductId'          => $product->getId(),
                        'zoom'                     => $zoomOptions
                    );
                    break;
                case 'zoom':
                    $configs[$type] = $zoomOptions;
                    break;
            }
            $commonConfigs = array(
                'productNameSelector'  => $this->getDevConfig('product_name_selector'),
                'productSkuSelector'   => $this->getDevConfig('product_sku_selector'),
                'imageSelector'        => $this->getDevConfig('image_selector'),
                'gallerySelector'      => $this->getDevConfig('gallery_selector'),
                'galleryImageSelector' => $this->getDevConfig('gallery_image_selector'),
                'zoomImageSelector'    => $this->getDevConfig('zoom_image_selector'),
                'getSimpleImage'       => $this->getDevConfig('get_simple_image'),
            );
            $configs[$type] = array_merge($configs[$type], $commonConfigs);
        }
        return $coreHelper->jsonEncode($configs);
    }

    public function getSimpleProductData($product, $type, $mode = 'grid')
    {
        $coreHelper = Mage::helper('core');
        $childProducts = Mage::getModel('catalog/product_type_configurable')->getUsedProducts(null, $product);
        $childProducts['default'] = $product;
        $dataHelper = Mage::helper('ave_colorswatch/data');
        return $coreHelper->jsonEncode(
            array(
                'simpleProducts' => $dataHelper->prepareSimpleProductsInfo($childProducts, $type, $mode),
                'getSimpleImage' => $this->getDevConfig('get_simple_image'),
            )
        );
    }

    protected function getOptionsImages($attributeId)
    {
        $modelCollection = $this->_modelOption->getCollection();
        $modelCollection->addFieldToFilter('attribute_id', $attributeId);
        $optionsConfig = array(
            'color_options' => array(),
            'thumbnails'    => array(),
        );
        foreach ($modelCollection->getItems() as $option) {
            $image = $option->getImage();
            $optionId = $option->getOptionId();
            $optionsConfig['colors'][$optionId] = $option->getColor();

            $optionsConfig['images'][$optionId] = $image ?
                Mage::helper('ave_colorswatch/image')->getSwatchImageUrl($image, $attributeId) : null;

            $optionsConfig['listImages'][$optionId] = $image ?
                Mage::helper('ave_colorswatch/image')->getListSwatchImageUrl($image, $attributeId) : null;

            $optionsConfig['tooltipImages'][$optionId] = $image ?
                Mage::helper('ave_colorswatch/image')->getPopupSwatchImageUrl($image, $attributeId, 'view') : null;

            $optionsConfig['tooltipImagesList'][$optionId] = $image ?
                Mage::helper('ave_colorswatch/image')->getPopupSwatchImageUrl($image, $attributeId, 'list') : null;
        }
        return $optionsConfig;
    }

    public function getConfigValue($configName)
    {
        return Mage::getStoreConfig(self::CONFIG_TAB_PATH . $configName);
    }

    public function getStyleValue($configName)
    {
        return Mage::getStoreConfig(self::STYLE_TAB_PATH . $configName);
    }

    public function getDevConfig($configName)
    {
        return Mage::getStoreConfig(self::DEVELOPER_TAB_PATH . $configName);
    }

    public function getListConfig($configName)
    {
        return Mage::getStoreConfig(self::LIST_TAB_PATH . $configName);
    }
}