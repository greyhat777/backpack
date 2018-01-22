<?php

class Solwin_Bannerslider_Block_Adminhtml_Renderer_Image extends Mage_Adminhtml_Block_Widget_Grid_Column_Renderer_Abstract {

    public function render(Varien_Object $row) {
        $mediaurl = Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_MEDIA);
        $value = $row->getData($this->getColumn()->getIndex());
        return '<p style="text-align:center;padding-top:10px;"><img src="' . $mediaurl . DS . $value . '"  style="width:100px;height:100px;text-align:center;"/></p>';
    }

}
