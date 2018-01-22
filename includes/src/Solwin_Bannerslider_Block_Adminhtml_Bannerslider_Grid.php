
<?php

class Solwin_Bannerslider_Block_Adminhtml_Bannerslider_Grid extends Mage_Adminhtml_Block_Widget_Grid {

    public function __construct() {
        parent::__construct();
        $this->setId("bannersliderGrid");
        $this->setDefaultSort("id");
        $this->setDefaultDir("DESC");
        $this->setSaveParametersInSession(true);
    }

    protected function _prepareCollection() {
        $collection = Mage::getModel("bannerslider/bannerslider")->getCollection();
        $this->setCollection($collection);
        return parent::_prepareCollection();
    }

    protected function _prepareColumns() {
        $this->addColumn("id", array(
            "header" => Mage::helper("bannerslider")->__("ID"),
            "align" => "right",
            "width" => "50px",
            "type" => "number",
            "index" => "id",
        ));

        $this->addColumn("image", array(
            "header" => Mage::helper("bannerslider")->__("Image"),
            "index" => "image",
            "width" => "130px",
            "renderer" => "Solwin_Bannerslider_Block_Adminhtml_Renderer_Image",
        ));

        $this->addColumn("title", array(
            "header" => Mage::helper("bannerslider")->__("Title"),
            "index" => "title",
        ));
        $this->addColumn("url", array(
            "header" => Mage::helper("bannerslider")->__("URL"),
            "index" => "url",
        ));
        $this->addColumn("imageorder", array(
            "header" => Mage::helper("bannerslider")->__("Images Order"),
            "index" => "imageorder",
            "width" => "50px",
        ));
        $this->addColumn('status', array(
            'header' => Mage::helper('bannerslider')->__('Status'),
            'index' => 'status',
            'type' => 'options',
            'options' => Solwin_Bannerslider_Block_Adminhtml_Bannerslider_Grid::getOptionArray5(),
        ));

        $this->addExportType('*/*/exportCsv', Mage::helper('sales')->__('CSV'));
        $this->addExportType('*/*/exportExcel', Mage::helper('sales')->__('Excel'));

        return parent::_prepareColumns();
    }

    public function getRowUrl($row) {
        return $this->getUrl("*/*/edit", array("id" => $row->getId()));
    }

    protected function _prepareMassaction() {
        $this->setMassactionIdField('id');
        $this->getMassactionBlock()->setFormFieldName('ids');
        $this->getMassactionBlock()->setUseSelectAll(true);
        $this->getMassactionBlock()->addItem('remove_bannerslider', array(
            'label' => Mage::helper('bannerslider')->__('Remove Bannerslider'),
            'url' => $this->getUrl('*/adminhtml_bannerslider/massRemove'),
            'confirm' => Mage::helper('bannerslider')->__('Are you sure?')
        ));
        return $this;
    }

    static public function getOptionArray5() {
        $data_array = array();
        $data_array[0] = 'Enable';
        $data_array[1] = 'Disable';
        return($data_array);
    }

    static public function getValueArray5() {
        $data_array = array();
        foreach (Solwin_Bannerslider_Block_Adminhtml_Bannerslider_Grid::getOptionArray5() as $k => $v) {
            $data_array[] = array('value' => $k, 'label' => $v);
        }
        return($data_array);
    }
    
    static public function getTargetValue() {
        $data_array = array();
        $data_array['_new'] = 'Open in new window';
        $data_array['_parent'] = 'Open in current window';
        return($data_array);
    }
    
    static public function getDescValue() {
        $data_array = array();
        $data_array[0] = 'No';
        $data_array[1] = 'Yes';
        return($data_array);
    }
}
