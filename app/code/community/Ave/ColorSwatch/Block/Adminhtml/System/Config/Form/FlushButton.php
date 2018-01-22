<?php

class Ave_ColorSwatch_Block_Adminhtml_System_Config_Form_FlushButton
    extends Mage_Adminhtml_Block_System_Config_Form_Field
{
    private $_attributeFlushCacheImagesPath = 'adminhtml/ave_colorswatch_media/flush/index';

    protected function _getElementHtml(Varien_Data_Form_Element_Abstract $element)
    {
        /**
         * @var $sesParam Mage_Adminhtml_Model_Url
         */
        $sesParam = Mage::getModel('adminhtml/url')->addSessionParam();
        $flushUrl = $sesParam->getUrl($this->_attributeFlushCacheImagesPath);
        $this->setElement($element);
        $html = $this->getLayout()->createBlock('adminhtml/widget_button')
            ->setType('button')
            ->setClass('scalable')
            ->setLabel('Flush Images Cache!')
            ->setOnClick("flushAttributeCacheImages('" . $flushUrl . "', this);")
            ->toHtml();
        return $html;
    }
}

