<?php
class Ave_ColorSwatch_Model_System_Config_Source_ColorSwatch_Configattribute
{
    /**
     * Attributes array
     *
     * @var null|array
     */
    protected $_attributes = null;


    /**
     * Retrieve attributes as array
     *
     * @return array
     */
    public function toOptionArray()
    {
        if (is_null($this->_attributes)) {
            $attrCollection = Mage::getResourceModel('catalog/product_attribute_collection')
                ->addVisibleFilter()
                ->setFrontendInputTypeFilter(array('select'))
                ->addFieldToFilter('additional_table.is_configurable', 1)
                ->addFieldToFilter('additional_table.is_visible', 1)
                ->addFieldToFilter('main_table.is_user_defined', 1)
                ->setOrder('frontend_label', Varien_Data_Collection::SORT_ORDER_ASC);

            $this->_attributes = array();
            foreach ($attrCollection as $attribute) {
                $this->_attributes[] = array(
                    'label' => $attribute->getFrontendLabel(),
                    'value' => $attribute->getId(),
                );
            }
        }
        return $this->_attributes;
    }
}
