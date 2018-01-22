<?php
class Ave_ColorSwatch_Helper_Frontend extends Mage_Core_Helper_Abstract
{
    static private $_templates = array();

    public function getBlockTemplate($blockName, $template) {
        //NOTE: to save original template
        if(!isset(self::$_templates[$blockName])) {
            $block = Mage::app()->getLayout()->getBlock($blockName);
            if($block) {
                self::$_templates[$blockName] = $block->getTemplate();
            }
        }
        return $template;
    }
}