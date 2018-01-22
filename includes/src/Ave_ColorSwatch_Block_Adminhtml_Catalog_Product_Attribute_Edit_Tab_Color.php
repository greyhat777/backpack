<?php

/**
 * @property-read Mage_Adminhtml_Block_Media_Uploader $_uploader
 */
class Ave_ColorSwatch_Block_Adminhtml_Catalog_Product_Attribute_Edit_Tab_Color
    extends Mage_Adminhtml_Block_Catalog_Product_Attribute_Edit_Tab_Options
    implements Mage_Adminhtml_Block_Widget_Tab_Interface
{
    private $_colorData;
    private $_uploader;

    public function getUploader()
    {
        if (empty($this->_uploader)) {
            $this->_uploader = Mage::getModel('Mage_Adminhtml_Block_Media_Uploader');
        }
        return $this->_uploader;
    }

    public function __construct($name, $label = '')
    {
        parent::__construct();
        if (!$this->hasData('template')) {
            $this->setTemplate('ave/color_swatch/attribute/options.phtml');
        }
    }

    public function getColorData()
    {
        /**
         * @var Mage_Eav_Model_Resource_Entity_Attribute_Option_Collection $collection
         */
        if (isset($this->_colorData)) {
            return $this->_colorData;
        }
        if (!($attributeId = $this->getAttributeId())) {
            return array();
        }
        $collection = Mage::getResourceModel('eav/entity_attribute_option_collection')
            ->setPositionOrder('asc')
            ->setAttributeFilter($attributeId)
            ->setStoreFilter()
            ->load();
        $items = $collection->getItems();
        $colorItems = $this->getColorsOptions($attributeId);
        $this->mergeColorOptions($items, $colorItems);
        $this->_colorData = $items;
        return $this->_colorData;
    }

    public function getAttributeId()
    {
        $params = $this->getRequest()->getParams();
        return !empty($params['attribute_id']) ? $params['attribute_id'] : false;
    }

    public function isCorrectAttributeType()
    {
        $attributeType = $this->getAttributeObject()->getFrontendInput();
        if ($attributeType == 'select') {
            return true;
        }
        return false;
    }

    public function isActiveStatus()
    {
        $tagInfoModel = Mage::getModel('ave_colorswatch/attribute');
        if (($id = $this->getAttributeId())) {
            $tagInfoModel->load($id);
            $isColorPicker = $tagInfoModel->getData(Ave_ColorSwatch_Model_Observer::IS_COLOR_SWATCH);
            return $isColorPicker == 1 ? true : false;
        }
        return false;
    }

    /**
     * @param $items
     * @param $colorItems
     * @return $this
     */
    private function mergeColorOptions(&$items, $colorItems)
    {
        foreach ($items as &$item) {
            foreach ($colorItems as $colorItemKey => $colorItem) {
                if ($colorItem['option_id'] == $item['option_id']) {
                    $item['color'] = $colorItem['color'];
                    $item['image'] = $colorItem['image'];
                    unset($colorItems[$colorItemKey]);
                    break;
                }
            }
        }
        return $this;
    }

    /**
     * @param $attributeId
     * @return mixed
     */
    protected function getColorsOptions($attributeId)
    {
        $modelOption = Mage::getModel('ave_colorswatch/option')->getCollection();
        $modelOption->addFieldToFilter('attribute_id', $attributeId);
        return $modelOption->getItems();
    }

    public function getDataMaxSize()
    {
        return $this->getUploader()->getDataMaxSize();
    }

    public function getDataMaxSizeInBytes()
    {
        return $this->getUploader()->getDataMaxSizeInBytes();
    }

    public function getDeleteUrl($optionId)
    {
        return Mage::helper('ave_colorswatch/image')->getDeleteUrl(
            $optionId,
            $this->getRequest()->getParam('attribute_id')
        );
    }

    public function getConfigJson($optionId)
    {
        return Mage::helper('core')->jsonEncode($this->getConfigObj($optionId));
    }

    public function getConfigObj($optionId)
    {
        /**
         * @var $sesParam Mage_Adminhtml_Model_Url
         */
        $sesParam = Mage::getModel('adminhtml/url')->addSessionParam();
        $url = $sesParam->getUrl(
            Mage::helper('ave_colorswatch/image')->getUploadPath(),
            array(
                'attribute_id' => (int) $this->getRequest()->getParam('attribute_id'),
                'option_id'    => (int) $optionId
            )
        );
        $this->getConfig()->setUrl($url);
        $this->getConfig()->setParams(array('form_key' => $this->getFormKey(), 'option_id' => $optionId));
        $this->getConfig()->setFileField('Filedata');
        $this->getConfig()->setFilters(
            array(
                'images' => array(
                    'label' => Mage::helper('adminhtml')->__('Images (.gif, .jpg, .png)'),
                    'files' => array('*.gif', '*.jpg', '*.jpeg', '*.png')
                )
            )
        );
        $this->getConfig()->setWidth('32');
        $this->getConfig()->setHideUploadButton(true);
        return $this->getConfig()->getData();
    }

    public function getConfig()
    {
        if(is_null($this->_config)) {
            $this->_config = new Varien_Object();
        }

        return $this->_config;
    }

    /**
     * Prepare label for tab
     *
     * @return string
     */
    public function getTabLabel()
    {
        return Mage::helper('ave_colorswatch')->__('Color Options');
    }

    /**
     * Prepare title for tab
     *
     * @return string
     */
    public function getTabTitle()
    {
        return Mage::helper('ave_colorswatch')->__('Color Options');
    }

    /**
     * Returns status flag about this tab can be shown or not
     *
     * @return Boolean
     */
    public function canShowTab()
    {
        return true;
    }

    /**
     * Returns status flag about this tab hidden or not
     *
     * @return Boolean
     */
    public function isHidden()
    {
        return true;
    }
}