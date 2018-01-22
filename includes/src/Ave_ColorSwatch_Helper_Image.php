<?php

class Ave_ColorSwatch_Helper_Image extends Mage_Core_Helper_Abstract
{
    const MEDIA_PATH = 'catalog/attribute';
    const MIN_HEIGHT = 10;
    const MAX_HEIGHT = 1800;
    const MIN_WIDTH  = 10;
    const MAX_WIDTH  = 3800;


    private $_heightMini = 16;
    private $_widthMini  = 16;
    private $_heightAdminPreview = 75;
    private $_widthAdminPreview  = 75;

    protected $_imageSize = array(
        'minheight' => self::MIN_HEIGHT,
        'minwidth'  => self::MIN_WIDTH,
        'maxheight' => self::MAX_HEIGHT,
        'maxwidth'  => self::MAX_WIDTH,
    );

    protected $_allowedExtensions = array('jpg', 'gif', 'png');

    private $_attributeImageDeletePath = 'adminhtml/ave_colorswatch_media/delete/index';
    private $_attributeImageUploadPath = 'adminhtml/ave_colorswatch_media/upload/index';

    public function getAllowedImageExtensions()
    {
        return $this->_allowedExtensions;
    }

    public function getBaseUrl()
    {
        return Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_MEDIA) . self::MEDIA_PATH;
    }

    public static function getBaseDir()
    {
        return Mage::getBaseDir('media') . DS . str_replace("/", DS, self::MEDIA_PATH);
    }

    public function getDeleteUrl($optionId, $attribute_id)
    {
        /**
         * @var $sesParam Mage_Adminhtml_Model_Url
         */
        $sesParam = Mage::getModel('adminhtml/url')->addSessionParam();
        $url = $sesParam->getUrl(
            $this->_attributeImageDeletePath,
            array(
                'attribute_id' => (int) $attribute_id,
                'option_id'    => (int) $optionId
            )
        );
        return $url;
    }

    public function getUploadPath()
    {
        return $this->_attributeImageUploadPath;
    }

    public function upload($attributeId, $optionId)
    {
        $path = $this->getBaseDir() . DS . $attributeId . DS;
        $url = $this->getBaseUrl() . '/' . $attributeId . '/';
        try {
            $uploader = new Mage_Core_Model_File_Uploader("file");
            $uploader->setAllowRenameFiles(true);
            $uploader->setFilesDispersion(false);
            $uploader->setAllowCreateFolders(true);
            $uploader->setAllowedExtensions(array('gif', 'jpg', 'png')); //server-side validation of extension
            $result = $uploader->save($path);

            /**
             * Workaround for prototype 1.7 methods "isJSON", "evalJSON" on Windows OS
             */
            $result['tmp_name'] = str_replace(DS, "/", $result['tmp_name']);
            $result['path'] = str_replace(DS, "/", $result['path']);
            $result['url'] = $url . $result['file'];
            $result['html_id'] = Mage::app()->getRequest()->getPost('html_id');

            if (isset($result['file'])) {
                $result = array_merge_recursive($this->delete($optionId), $result);
                $this->_saveFileNameToDb($optionId, $attributeId, $result['file']);
                $this->resizePack($result['file'], $attributeId);
            }
        } catch(Exception $e) {
            $result = array(
                "error"     => $e->getMessage(),
                "errorCode" => $e->getCode(),
                "status"    => "error"
            );
        }
        return $result;
    }

    public function deleteAttributeDirectory($attributeId)
    {
        if (!empty($attributeId) && $this->removePack($attributeId, null, true)) {
            return true;
        }
        return false;
    }

    /**
     * @param $optionId
     * @return array
     */
    public function delete($optionId)
    {
        if (empty($optionId)) {
            return array();
        }
        $optionModel = Mage::getModel('ave_colorswatch/option');
        $optionModel->load($optionId);
        $imageName = $optionModel->getData('image');
        if (empty($imageName)) {
            return array();
        }
        $attributeId = (int) $optionModel->getData('attribute_id');
        $path = self::getBaseDir() . DS . $attributeId . DS;
        $imagePath = rtrim($path, DS) . DS . ltrim($imageName, DS);
        if ($this->removePack($attributeId, $imageName)) {
            $optionModel->setData('image', '');
            $optionModel->save();
            $result = array("status" => "success");
        } else {
            $result = array('status' => 'error', 'error' => 'can not remove image ' . $imagePath);
        }
        return $result;
    }

    public function getSwatchImageUrl($imageName, $attributeId)
    {
        return $this->_getImageUrl(
            $imageName,
            $attributeId,
            $this->getProductSwatchWidth(),
            $this->getProductSwatchHeight()
        );
    }

    public function getListSwatchImageUrl($imageName, $attributeId)
    {
        return $this->_getImageUrl(
            $imageName,
            $attributeId,
            $this->getProductListSwatchWidth(),
            $this->getProductListSwatchHeight()
        );
    }

    public function getPopupSwatchImageUrl($imageName, $attributeId, $type)
    {
        return $this->_getImageUrl(
            $imageName,
            $attributeId,
            $this->getProductPopupSwatchWidth($type),
            $this->getProductPopupSwatchHeight($type)
        );
    }

    public function getMiniImageUrl($imageName, $attributeId)
    {
        return $this->_getImageUrl($imageName, $attributeId, $this->_widthMini, $this->_heightMini);
    }

    public function getAdminPreviewImageUrl($imageName, $attributeId)
    {
        return $this->_getImageUrl($imageName, $attributeId, $this->_widthAdminPreview, $this->_heightAdminPreview);
    }

    /**
     * @param $imageName
     * @param $attributeId
     * @return $this|bool
     */
    public function resizePack($imageName, $attributeId)
    {
        if (!$imageName) {
            return false;
        }
        $this->resizeCropThumb(
            $imageName,
            $attributeId,
            $this->getProductSwatchWidth(),
            $this->getProductSwatchHeight()
        );
        $this->resizeCropThumb(
            $imageName,
            $attributeId,
            $this->getProductListSwatchWidth(),
            $this->getProductListSwatchHeight()
        );
        return $this;
    }

    /**
     * Removes folder with cached images
     *
     * @return boolean
     */
    public function flushImagesCache()
    {
        //todo: викликати це чудо з конфігу
        $cacheDir  = $this->getBaseDir() . DS . 'cache' . DS ;
        $io = new Varien_Io_File();
        if ($io->fileExists($cacheDir, false) ) {
            return $io->rmdir($cacheDir, true);
        }
        return true;
    }

    /**
     * @param $imageName
     * @param $attributeId
     * @param $width
     * @param $height
     * @return bool
     */
    protected function resizeCropThumb($imageName, $attributeId, $width, $height)
    {
        $width = (int) $width;
        $height = (int) $height;
        $size = $this->_getSizePrefix($width, $height);
        $cacheDir = $this->_getCacheDir($attributeId, $size);
        $io = new Varien_Io_File();
        $io->checkAndCreateFolder($cacheDir);
        $io->open(array('path' => $cacheDir));
        if ($io->fileExists($imageName)) {
            return true;
        }
        try {
            $image = new Varien_Image($this->getBaseDir() . DS . $attributeId . DS . $imageName);
            $image->constrainOnly(false);
            $image->backgroundColor(array(255, 255, 255));
            $image->keepAspectRatio(true);
            $image->keepTransparency(true);
            if (Mage::getStoreConfig('ave_color_swatch/style_settings/use_crop')) {
                $image->keepFrame(false);
                $currentRatio = $image->getOriginalWidth() / $image->getOriginalHeight();
                $targetRatio = $width / $height;
                if ($targetRatio > $currentRatio) {
                    $image->resize($width, null);
                } else {
                    $image->resize(null, $height);
                }

                $diffWidth = $image->getOriginalWidth() - $width;
                $diffHeight = $image->getOriginalHeight() - $height;
                $image->crop(
                    floor($diffHeight * 0.5),
                    floor($diffWidth / 2),
                    ceil($diffWidth / 2),
                    ceil($diffHeight * 0.5)
                );
            } else {
                $image->keepFrame(true);
                $image->resize($width, $height);
            }
            $image->save($cacheDir . DS . $imageName);
            return true;
        } catch (Exception $e) {
            Mage::logException($e);
            return false;
        }
    }
    /**
     * @param $imageNameOriginal
     * @param $attributeId
     * @param $width
     * @param $height
     * @param $crop
     * @return Varien_Image|bool
     */
    public function resizeCropProductThumb($imageNameOriginal, $attributeId, $width, $height, $crop = true)
    {
        $imageName = explode("/", $imageNameOriginal);
        $imageName = $imageName[count($imageName) - 1];
        $width = (int) $width;
        $height = (int) $height;
        $size = $this->_getSizePrefix($width, $height);
        $cacheDir = $this->_getCacheDir($attributeId, $size);
        $io = new Varien_Io_File();
        $io->checkAndCreateFolder($cacheDir);
        $io->open(array('path' => $cacheDir));
        if ($io->fileExists($imageName)) {
            return $this->getBaseUrl() . '/' . $this->_getSizePrefix($width, $height) . '/' . $attributeId . '/' . $imageName;
        }
        try {
            $image = new Varien_Image(Mage::getBaseDir('media') . DS . 'catalog' . DS . 'product/' . $imageNameOriginal);
            $image->constrainOnly(false);
            $image->backgroundColor(array(255, 255, 255));
            $image->keepAspectRatio(true);
            $image->keepTransparency(true);
            if ($crop && Mage::getStoreConfig('ave_color_swatch/style_settings/use_crop')) {
                $image->keepFrame(false);
                $currentRatio = $image->getOriginalWidth() / $image->getOriginalHeight();
                $targetRatio = $width / $height;
                if ($targetRatio > $currentRatio) {
                    $image->resize($width, null);
                } else {
                    $image->resize(null, $height);
                }

                $diffWidth = $image->getOriginalWidth() - $width;
                $diffHeight = $image->getOriginalHeight() - $height;
                $image->crop(
                    floor($diffHeight * 0.5),
                    floor($diffWidth / 2),
                    ceil($diffWidth / 2),
                    ceil($diffHeight * 0.5)
                );
            } else {
                $image->keepFrame(true);
                $image->resize($width, $height);
            }
            $image->save($cacheDir . DS . $imageName);
            return $this->getBaseUrl() . '/' . $this->_getSizePrefix($width, $height) . '/' . $attributeId . '/' . $imageName;
        } catch (Exception $e) {
            Mage::logException($e);
        }
        return false;
    }

     private function remove($path, $onlyFile = true)
    {
        $io = new Varien_Io_File();
            $io->open(array('path' => $this->getBaseDir()));
        if ($io->fileExists($path, $onlyFile)) {
            return $io->rm($path);
        }
        return false;
    }

    private function removePack($attributeId, $imageName = null, $removeDirectory = false)
    {
        $sizes = array(
            $this->_getSizePrefix($this->getProductSwatchWidth(), $this->getProductSwatchHeight()),
            $this->_getSizePrefix($this->getProductListSwatchWidth(), $this->getProductListSwatchHeight())
        );
        foreach ($sizes as $size) {
            if (!empty($imageName)) {
                $this->remove($this->_getCacheDir($attributeId, $size) . DS . $imageName);
            }
            if ($removeDirectory) {
                $this->remove($this->_getCacheDir($attributeId, $size));
            }
        }
        return $this->remove($this->getBaseDir() . DS . $attributeId . DS . $imageName);
    }

    /**
     * @param $optionId
     * @param $attributeId
     * @param $fileName
     */
    private function _saveFileNameToDb($optionId, $attributeId, $fileName)
    {
        $optionModel = Mage::getModel('ave_colorswatch/option');
        $optionModel->load($optionId);
        $optionModel->addData(
            array(
                'option_id'    => $optionId,
                'attribute_id' => $attributeId,
                'image'        => $fileName
            )
        );
        $optionModel->save();
    }

    /**
     * @param $width
     * @param $height
     * @return string
     */
    protected function _getSizePrefix($width, $height)
    {
        return 'cache/' . $width . 'x' . $height;
    }

    /**
     * @return int
     */
    public function getProductSwatchHeight()
    {
        return (int) Mage::getStoreConfig('ave_color_swatch/style_settings/swatch_height');
    }

    /**
     * @return int
     */
    public function getProductSwatchWidth()
    {
        return (int) Mage::getStoreConfig('ave_color_swatch/style_settings/swatch_width');
    }

    /**
     * @return int
     */
    public function getProductListSwatchHeight()
    {
        return (int) Mage::getStoreConfig('ave_color_swatch/style_settings/list_option_height');
    }

    /**
     * @return int
     */
    public function getProductListSwatchWidth()
    {
        return (int) Mage::getStoreConfig('ave_color_swatch/style_settings/list_option_width');
    }

    /**
     * @param $type string;
     * @return int
     */
    public function getProductPopupSwatchHeight($type)
    {
        switch($type){
            case 'view':
                return (int) Mage::helper('ave_colorswatch/config')->getConfigValue('product_tooltip_height');
            case 'list':
                return (int) Mage::helper('ave_colorswatch/config')->getListConfig('list_tooltip_height');
            default:
                return 100;
        }
    }

    /**
     * @param $type string;
     * @return int
     */
    public function getProductPopupSwatchWidth($type)
    {
        switch($type){
            case 'view':
                return (int) Mage::getStoreConfig('ave_color_swatch/product_view_group/product_tooltip_width');
            case 'list':
                return (int) Mage::helper('ave_colorswatch/config')->getListConfig('list_tooltip_width');
            default:
                return 100;
        }
    }

    protected function _getCacheDir($attributeId, $size)
    {
        return $this->getBaseDir() . DS . $size . DS . $attributeId;
    }

    protected function _getImageUrl($imageName, $attributeId, $width, $height)
    {
        $this->resizeCropThumb($imageName, $attributeId, $width, $height);
        return
            $this->getBaseUrl() . '/' . $this->_getSizePrefix($width, $height) . '/' . $attributeId . '/' . $imageName;
    }
}
