<?php

class Ave_ColorSwatch_Block_Catalogsearch_Layer_Filter_Attribute extends Mage_CatalogSearch_Block_Layer_Filter_Attribute
{
    public function __construct()
    {
        parent::__construct();
        if (Mage::getStoreConfig(Ave_ColorSwatch_Helper_Config::LIST_TAB_PATH . 'list_module_enable')) {
            $this->setTemplate('ave/color_swatch/filter.phtml');
        }
    }

    public function shouldDisplayProductCount()
    {
        if (method_exists('Mage_Catalog_Block_Layer_Filter_Attribute', 'shouldDisplayProductCount')) {
            return parent::shouldDisplayProductCount();
        }
        return true;
    }
}