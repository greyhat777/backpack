<?php

class Ave_ColorSwatch_Block_Catalog_Layer_Filter_Attribute extends Mage_Catalog_Block_Layer_Filter_Attribute
{
    public function __construct()
    {
        parent::__construct();
        if (Mage::getStoreConfig('ave_color_swatch/product_list_group/list_module_enable')) {
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