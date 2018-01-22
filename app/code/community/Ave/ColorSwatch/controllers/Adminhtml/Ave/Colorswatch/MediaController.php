<?php
class Ave_ColorSwatch_Adminhtml_Ave_Colorswatch_MediaController extends Mage_Adminhtml_Controller_Action
{

    public function uploadAction()
    {
        if (!empty($_FILES))
        {
            $attributeId = (int) $this->getRequest()->getParam('attribute_id');
            $optionId = (int) $this->getRequest()->getParam('option_id');
            $result = $this->getHelperImage()->upload($attributeId, $optionId);
            $result['url'] = $this->getHelperImage()->getAdminPreviewImageUrl($result['name'], $attributeId);
            $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
        }
    }

    public function flushAction()
    {
        $this->getHelperImage()->flushImagesCache();
        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode(array("status" => "success")));
    }

    public function deleteAction()
    {
        $optionId = (int) $this->getRequest()->getParam('option_id');
        if (empty($optionId)) {
            $this->getResponse()->setBody(
                Mage::helper('core')->jsonEncode(array('status' => 'error', 'error' => 'no ID option'))
            );
            return false;
        }
        try {
            $result = $this->getHelperImage()->delete($optionId);
        } catch(Exception $e) {
            $result = array(
                "error"     => $e->getMessage(),
                "errorCode" => $e->getCode(),
                "status"    => "error"
            );
        }
        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
        return false;
    }

    /**
     * Check admin permissions for this controller
     *
     * @return boolean
     */
    protected function _isAllowed()
    {
        return Mage::getSingleton('admin/session')->isAllowed('admin/catalog/attributes/attributes');
    }

    /**
     * @return Ave_ColorSwatch_Helper_Image
     */
    protected function getHelperImage()
    {
        return Mage::helper('ave_colorswatch/image');
    }
}