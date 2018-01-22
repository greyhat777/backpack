<?php

class Solwin_Bannerslider_Model_Options {

    public function positionNavigation() {
        $options = array(
            'out-center-bottom' => Mage::helper('bannerslider')->__('out-center-bottom'),
            'out-left-bottom' => Mage::helper('bannerslider')->__('out-left-bottom'),
            'out-right-bottom' => Mage::helper('bannerslider')->__('out-right-bottom'),
            'out-center-top' => Mage::helper('bannerslider')->__('out-center-top'),
            'out-right-top' => Mage::helper('bannerslider')->__('out-right-top'),
            'in-center-bottom' => Mage::helper('bannerslider')->__('in-center-bottom'),
            'in-left-bottom' => Mage::helper('bannerslider')->__('in-left-bottom'),
            'in-right-bottom' => Mage::helper('bannerslider')->__('in-right-bottom'),
            'in-left-top' => Mage::helper('bannerslider')->__('in-left-top'),
            'in-right-top' => Mage::helper('bannerslider')->__('in-right-top'),
            'in-left-middle' => Mage::helper('bannerslider')->__('in-left-middle'),
            'in-right-middle' => Mage::helper('bannerslider')->__('in-right-middle'),
        );
        return $options;
    }
    
    public function navigationType() {
        $options = array(
            'number' => Mage::helper('bannerslider')->__('Number'),
            'circle' => Mage::helper('bannerslider')->__('Circle'),
            'square' => Mage::helper('bannerslider')->__('Square'),
        );
        return $options;
    }
    
    public function positionControl() {
        $options = array(
            'left-right' => Mage::helper('bannerslider')->__('left-right'),
            'top-center' => Mage::helper('bannerslider')->__('top-center'),
            'bottom-center' => Mage::helper('bannerslider')->__('bottom-center'),
            'top-left' => Mage::helper('bannerslider')->__('top-left'),
            'top-right' => Mage::helper('bannerslider')->__('top-right'),
            'bottom-left' => Mage::helper('bannerslider')->__('bottom-left'),
            'bottom-right' => Mage::helper('bannerslider')->__('bottom-right'),
        );
        return $options;
    }
    
    public function transitionEffect() {
        $options = array(
            'random' => Mage::helper('bannerslider')->__('random'),
            'slide-left' => Mage::helper('bannerslider')->__('slide-left'),
            'slide-right' => Mage::helper('bannerslider')->__('slide-right'),
            'slide-top' => Mage::helper('bannerslider')->__('slide-top'),
            'slide-bottom' => Mage::helper('bannerslider')->__('slide-bottom'),
            'fade' => Mage::helper('bannerslider')->__('fade'),
            'split' => Mage::helper('bannerslider')->__('split'),
            'split3d' => Mage::helper('bannerslider')->__('split3d'),
            'door' => Mage::helper('bannerslider')->__('door'),
            'wave-left' => Mage::helper('bannerslider')->__('wave-left'),
            'wave-right' => Mage::helper('bannerslider')->__('wave-right'),
            'wave-top' => Mage::helper('bannerslider')->__('wave-top'),
            'wave-bottom' => Mage::helper('bannerslider')->__('wave-bottom'),
        );
        return $options;
    }
}
