<?php

class Solwin_Bannerslider_Block_Adminhtml_Bannerslider_Edit_Tab_Form extends Mage_Adminhtml_Block_Widget_Form {

    protected function _prepareForm() {

        $form = new Varien_Data_Form();
        $this->setForm($form);
        $fieldset = $form->addFieldset("bannerslider_form", array("legend" => Mage::helper("bannerslider")->__("Item information")));


        $fieldset->addField("title", "text", array(
            "label" => Mage::helper("bannerslider")->__("Title"),
            "class" => "required-entry",
            "required" => true,
            "name" => "title",
        ));

        $fieldset->addField('image', 'image', array(
            'label' => Mage::helper('bannerslider')->__('Images'),
            'name' => 'image',
            'note' => '(*.jpg, *.png, *.gif)',
        ));
        $fieldset->addField('status', 'select', array(
            'label' => Mage::helper('bannerslider')->__('Status'),
            'values' => Solwin_Bannerslider_Block_Adminhtml_Bannerslider_Grid::getValueArray5(),
            'name' => 'status',
            "class" => "required-entry",
            "required" => true,
        ));
        $fieldset->addField("description", "textarea", array(
            "label" => Mage::helper("bannerslider")->__("Description"),
            "name" => "description",
        ));

        $fieldset->addField("showdesc", "select", array(
            "label" => Mage::helper("bannerslider")->__("Show Description"),
            "name" => "showdesc",
            'values' => Solwin_Bannerslider_Block_Adminhtml_Bannerslider_Grid::getDescValue(),
        ));
        
        $fieldset->addField("url", "text", array(
            "label" => Mage::helper("bannerslider")->__("URL"),
            "name" => "url",
        ));
        
        $fieldset->addField("target", "select", array(
            "label" => Mage::helper("bannerslider")->__("Target"),
            "name" => "target",
            'values' => Solwin_Bannerslider_Block_Adminhtml_Bannerslider_Grid::getTargetValue(),
        ));

        $fieldset->addField("imageorder", "text", array(
            "label" => Mage::helper("bannerslider")->__("Sort Order"),
            "name" => "imageorder",
        ));


        if (Mage::getSingleton("adminhtml/session")->getResponsivebannersliderData()) {
            $form->setValues(Mage::getSingleton("adminhtml/session")->getResponsivebannersliderData());
            Mage::getSingleton("adminhtml/session")->setResponsivebannersliderData(null);
        } elseif (Mage::registry("bannerslider_data")) {
            $form->setValues(Mage::registry("bannerslider_data")->getData());
        }
        return parent::_prepareForm();
    }

}
