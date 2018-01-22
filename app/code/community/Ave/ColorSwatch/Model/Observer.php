<?php

class Ave_ColorSwatch_Model_Observer
{

    const COLORPICKER_SECTION = 'ave_color_swatch';

    const IS_COLOR_SWATCH = 'is_ave_color_swatch';

    public function onSaveAttribute(Varien_Event_Observer $observer)
    {
        $attribute = $observer->getData('attribute');
        $attributeId = $attribute->getData('attribute_id');
        $options = $attribute->getOption();
        $this->_deleteAttributeImages($options);
        $this->_saveAttribute($attributeId, $attribute->getData(self::IS_COLOR_SWATCH));
        $this->_saveOptions($attributeId, $attribute->getOption());
        return $this;
    }

    public function onDeleteAttribute(Varien_Event_Observer $observer)
    {
        $attribute = $observer->getData('attribute');
        $attributeId = $attribute->getData('attribute_id');
        $items = $this->getColorsOptions($attributeId);
        foreach ($items as $item) {
            Mage::helper('ave_colorswatch/image')->delete($item['option_id']);
        }
        Mage::helper('ave_colorswatch/image')->deleteAttributeDirectory($attributeId);
        return $this;
    }

    public function addCustomLayoutConfigHandle(Varien_Event_Observer $observer)
    {
        /** @var $layout  Mage_Core_Model_Layout */
        $event = $observer->getEvent();
        $controllerAction = $event->getAction();
        $layout = $event->getLayout();
        if ($controllerAction && $layout && $controllerAction instanceof Mage_Adminhtml_System_ConfigController) {
            if ($controllerAction->getRequest()->getParam('section') == self::COLORPICKER_SECTION) {
                $layout->getUpdate()->addHandle('adminhtml_system_config_edit_ave_color_swatch');
            }
        }
        return $this;
    }

    /**
     * Retrieve the product model
     *
     * @return Mage_Catalog_Model_Product $product
     */
    public function getProduct()
    {
        return Mage::registry('product');
    }

    /**
     * @param $attributeId
     * @return mixed
     */
    protected function getColorsOptions($attributeId)
    {
        $modelOption = Mage::getModel('ave_colorswatch/option')->getCollection();
        $modelOption->addFieldToFilter('attribute_id', $attributeId);
        return $modelOption->getItems();
    }

    /**
     * Shortcut to getRequest
     *
     */
    protected function _getRequest()
    {
        return Mage::app()->getRequest();
    }

    /**
     * @param $attributeId
     * @param $colorPickerValue
     */
    protected function _saveAttribute($attributeId, $colorPickerValue)
    {
        $tagInfoModel = Mage::getModel('ave_colorswatch/attribute');
        $tagInfoModel->addData(array('attribute_id' => $attributeId, self::IS_COLOR_SWATCH => $colorPickerValue ? 1 : 0));
        $tagInfoModel->save();
    }

    /**
     * @param $attributeId
     * @param $options
     * @return $this|bool
     */
    protected function _saveOptions($attributeId, $options)
    {
        $modelOption = Mage::getModel('ave_colorswatch/option');
        if (empty($options['ave_color'])) {
            return false;
        }
        foreach ($options['ave_color'] as $id => $option) {
            $item = array(
                'attribute_id' => $attributeId,
                'option_id'    => $id,
                'color'        => $options['ave_color'][$id]
            );
            if (!empty($options['ave_image'][$id])) {
                $item['image'] = $options['ave_image'][$id];
            }
            $modelOption->addData($item);
            $modelOption->save();
        }
        return $this;
    }

    protected function _deleteAttributeImages($options)
    {
        if (empty($options) || empty($options['delete'])) {
            return $this;
        }
        foreach ($options['delete'] as $optionId => $isDelete) {
            if (!empty($isDelete)) {
                Mage::helper('ave_colorswatch/image')->delete($optionId);
            }
        }
        return $this;
    }

    public function addProductOptions2Session(Varien_Event_Observer $observer)
    {
        /** @var $controller Mage_Checkout_CartController */
        $controller = $observer->getControllerAction();
        $params = $controller->getRequest()->getParams();
        if (isset($params['isCP'])) {
            Mage::getSingleton('core/session')->setData('ave_colorswatch_options', $params);
        } else {
            Mage::getSingleton('core/session')->unsetData('ave_colorswatch_options');
        }

        return $this;
    }

    public function getProductOptions2Session(Varien_Event_Observer $observer)
    {
        /** @var $controller Mage_Catalog_ProductController */
        if ($params = Mage::getSingleton('core/session')->getData('ave_colorswatch_options')) {
            $product = $observer->getProduct();
            $optionValues = $product->processBuyRequest(new Varien_Object($params));
            $optionValues->setQty(1);
            $product->setPreconfiguredValues($optionValues);
        }
        return $this;
    }
}