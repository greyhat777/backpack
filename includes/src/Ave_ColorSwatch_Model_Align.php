<?php

class Ave_ColorSwatch_Model_Align
{
    public function toOptionArray()
    {
        return array(
            array('value' => "left", 'label' => Mage::helper('ave_colorswatch')->__('Left')),
            array('value' => "center", 'label' => Mage::helper('ave_colorswatch')->__('Center')),
            array('value' => "right", 'label' => Mage::helper('ave_colorswatch')->__('Right')),
        );
    }
}