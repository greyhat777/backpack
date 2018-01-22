<?php

class Ave_ColorSwatch_Model_Shape
{
    public function toOptionArray()
    {
        return array(
            array('value' => "square", 'label' => Mage::helper('ave_colorswatch')->__('Square')),
            array('value' => "rounded", 'label' => Mage::helper('ave_colorswatch')->__('Rounded')),
            array('value' => "circle", 'label' => Mage::helper('ave_colorswatch')->__('Circle')),
        );
    }
}