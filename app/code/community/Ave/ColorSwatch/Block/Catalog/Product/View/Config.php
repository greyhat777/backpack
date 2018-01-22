<?php

class Ave_ColorSwatch_Block_Catalog_Product_View_Config extends Mage_Core_Block_Template
{
    protected $_product;
    /** @var $_configHelper Ave_ColorSwatch_Helper_Config */
    protected $_configHelper;

    protected function _construct()
    {
        parent::_construct();
        $this->init();
        return $this;
    }

    protected function init()
    {
        $this->_product = Mage::getModel('catalog/product')->load(Mage::registry('current_product')->getId());
        $this->_configHelper = Mage::helper('ave_colorswatch/config');
        return $this;
    }
    /**
     * @return string
     */
    public function getDefaultConfig()
    {
        return $this->_configHelper->getConfig(array('colorSwatch'),$this->_product);
    }

    public function getDefaultOptions()
    {
        return $this->_configHelper->getDefaultOptions($this->_product) . ', ' .
        $this->_configHelper->getJsonConfig($this->_product);
    }
}
 