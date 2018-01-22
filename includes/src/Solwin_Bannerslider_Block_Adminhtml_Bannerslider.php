<?php

class Solwin_Bannerslider_Block_Adminhtml_Bannerslider extends Mage_Adminhtml_Block_Widget_Grid_Container {

    public function __construct() {
        $this->_controller = "adminhtml_bannerslider";
        $this->_blockGroup = "bannerslider";
        $this->_headerText = Mage::helper("bannerslider")->__("Bannerslider Manager");
        $this->_addButtonLabel = Mage::helper("bannerslider")->__("Add New Item");
        parent::__construct();
    }
}
