<?php

class Ave_ColorSwatch_Model_Resource_Option extends Mage_Core_Model_Resource_Db_Abstract
{

    protected $_isPkAutoIncrement = false;

    protected function _construct()
    {
        $this->_init('ave_colorswatch/option', 'option_id');
    }

}