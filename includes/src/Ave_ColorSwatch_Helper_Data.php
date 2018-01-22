<?php

class Ave_ColorSwatch_Helper_Data extends Mage_Core_Helper_Abstract
{
    const TYPE_VIEW = 'view';
    const TYPE_LIST = 'list';

    protected $_zoomScale = null;
    protected $_mainImageWidth = null;
    protected $_mainImageHeight = null;
    protected $_listImageWidth = null;
    protected $_listImageHeight = null;
    protected $_width = null;
    protected $_height = null;
    protected $_thumbnailImageWidth;
    protected $_thumbnailImageHeight;
    /**@var Mage_Catalog_Helper_Image */
    protected $_imageHelper = null;
    protected $_zoomImages = null;
    protected $_type = null;
    protected $_mode = null;
    protected $_keepFrame = null;

    /**
     * @param $block Mage_Catalog_Block_Product_List
     * @param $product Mage_Catalog_Model_Product
     * @return $this
     */
    public function layout($block, $product)
    {
        $isCustomColorSwatch = Mage::helper('core')->isModuleEnabled('Ave_ColorSwatchCustom');
        if ($product->getTypeID() == 'configurable'
            && Mage::getStoreConfig('ave_color_swatch/product_list_group/list_module_enable')
                && $block->getChild('ave_color_swatch')
        ) {
            $formTagOpen = '<form action="' . $block->getLayout()->getBlockSingleton('Mage_Catalog_Block_Product_Price')
                    ->getSubmitUrl($product) . '"
                          method="post" id="product_addtocart_form_' . $product->getId() . '"
                          name="product-addtocart-form-' . $product->getId() . '">';
            echo $formTagOpen;
            $block->getChild('ave_color_swatch')->setProduct($product);
            $block->getChild('ave_color_swatch')->setData('mode', $block->getMode());
            $block->getChild('ave_color_swatch')->setData('addToCartUrl', $block->getAddToCartUrl($product));
            echo $block->getChildHtml('ave_color_swatch', false);
            echo '<input type="hidden" value="1" name="isCP">';
            if (!$isCustomColorSwatch)
                echo '<input type=submit value="submit" name="submit" style="display: none;"></form>';
        }
        return $this;
    }

    public function prepareSimpleProductsInfo($childProducts, $type, $mode)
    {
        $allChildrenData = array();
        $this->setDefaultOptions($type, $mode);
        foreach ($childProducts as $key => $childProduct) {
            if ($type != "list") {
                $childProduct->load('media_gallery');
            }
            $mediaGallery = $childProduct->getMediaGalleryImages();
            $newKey = (($key === "default") ? $key : $childProduct->getId());
            $allChildrenData[$newKey] = $this->prepareData4SimpleProduct($childProduct, $mediaGallery);
        }
        if ($this->_type == self::TYPE_VIEW)
            $allChildrenData['zoomImages'] = $this->_zoomImages;
        return $allChildrenData;
    }

    protected function prepareData4SimpleProduct($product, $mediaGallery)
    {
        $data = array(
            'image'            => '',
            'shortDescription' => '',
        );
        if ($this->_type == self::TYPE_VIEW) {
            $additionalData = array(
                'imageGallery' => array(),
                'name'         => '',
                'description'  => '',
            );
            $data = array_merge($data, $additionalData);
        }

        if ($product->getImage() != null && $product->getImage() != "no_selection") {
            $image = $this->_imageHelper->init($product, 'image');
            $imageUrl = ($this->_type == self::TYPE_VIEW) ?
                $this->_resizeImage($image, $this->_mainImageWidth, $this->_mainImageHeight) :
                $this->_resizeImage($image, $this->_listImageWidth, $this->_listImageHeight);
            $data["image"] = $imageUrl;

            if (1 == (int)Mage::helper('ave_colorswatch/config')->getDevConfig('get_simple_image')) {
                $data["thumbnail"] = ($this->_type == self::TYPE_VIEW)
                    ? Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                        $product->getImage(),
                        0,
                        Mage::helper('ave_colorswatch/image')->getProductSwatchWidth(),
                        Mage::helper('ave_colorswatch/image')->getProductSwatchHeight()
                    )
                    : Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                        $product->getImage(),
                        0,
                        Mage::helper('ave_colorswatch/image')->getProductListSwatchWidth(),
                        Mage::helper('ave_colorswatch/image')->getProductListSwatchHeight()
                    );

                $data["tooltipImage"] = ($this->_type == self::TYPE_VIEW)
                    ? Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                        $product->getImage(),
                        0,
                        Mage::helper('ave_colorswatch/image')->getProductPopupSwatchWidth(self::TYPE_VIEW),
                        Mage::helper('ave_colorswatch/image')->getProductPopupSwatchHeight(self::TYPE_VIEW)
                    )
                    : Mage::helper('ave_colorswatch/image')->resizeCropProductThumb(
                        $product->getImage(),
                        0,
                        Mage::helper('ave_colorswatch/image')->getProductPopupSwatchWidth(self::TYPE_LIST),
                        Mage::helper('ave_colorswatch/image')->getProductPopupSwatchHeight(self::TYPE_LIST)
                    );
            }

            if ($this->_type == self::TYPE_VIEW) {
                $this->_zoomImages[$imageUrl] = $this->_width ?
                    $this->_resizeImage($image, $this->_width, $this->_height) : $imageUrl;
            }
        }

        $_helper = Mage::helper('catalog/output');
        $data["shortDescription"] = $_helper
            ->productAttribute($product, nl2br($product->getShortDescription()), 'short_description');
        if ($this->_type == self::TYPE_VIEW) {
            $data["description"] = $_helper->productAttribute($product, nl2br($product->getDescription()), 'description');
            array_push($data["imageGallery"], $this->prepareAdditionalImages($mediaGallery, $product));
        }
        $data["name"] = $product->getName();
        $data["sku"] = $product->getSku();
        $data["inStock"] = $product->getStockItem()->getIsInStock();
        if ($product->getPrice()) {
            $store = Mage::app()->getStore();
            $data["price"] = $store->getCurrentCurrency()->format($product->getPrice());
        }
        return $data;
    }

    protected function prepareAdditionalImages($mediaGallery, $product)
    {
        $tempArray = array(
            "gallery_urls"   => array(),
            "thumbnail_urls" => array(),
            "titles"         => array(),
            "alts"           => array(),
        );
        foreach ($mediaGallery as $_image) {
            $_imageFile = $_image->getFile();
            $_imageLabel = $_image->getLabel();
            $thumb_url = (string)$this->_imageHelper
                ->init($product, 'thumbnail', $_imageFile)->resize($this->_thumbnailImageWidth, $this->_thumbnailImageHeight);

            $gallery_url = $this->_resizeImage($this->_imageHelper
                ->init($product, 'image', $_imageFile), $this->_mainImageWidth, $this->_mainImageHeight);

            if ($this->_width) {
                $this->_zoomImages[(string)$gallery_url] = $this->_resizeImage($this->_imageHelper
                        ->init($product, 'image', $_imageFile), $this->_width, $this->_height
                );
            } else {
                $this->_zoomImages[(string)$gallery_url] = (string)$this->_imageHelper
                                ->init($product, 'image', $_imageFile);
            }
            array_push($tempArray["gallery_urls"], (string)$gallery_url);
            array_push($tempArray["thumbnail_urls"], (string)$thumb_url);
            array_push($tempArray["titles"], $_imageLabel);
            array_push($tempArray["alts"], $this->_imageHelper->htmlEscape($_imageLabel));
        }
        return $tempArray;
    }

    protected function setDefaultOptions($type, $mode)
    {
        $this->_imageHelper = Mage::helper('catalog/image');
        $configHelper = Mage::helper('ave_colorswatch/config');
        $this->_type = $type;
        switch ($this->_type):
            case self::TYPE_VIEW:
                $zoomScale = Mage::getStoreConfig('ave_zoom/zoom_group/zoom_scale');
                $mainImageWidth = (int)$configHelper->getDevConfig('image_width');
                $mainImageHeight = (int)$configHelper->getDevConfig('image_height');
                $height = (int)$configHelper->getDevConfig('zoom_image_height');

                $this->_zoomScale = ($zoomScale ? $zoomScale : 2.5) * 2;
                $this->_mainImageWidth = $mainImageWidth ? $mainImageWidth : null;
                $this->_mainImageHeight = $mainImageHeight ? $mainImageHeight : null;
                $this->_width = (int)$configHelper->getDevConfig('zoom_image_width');
                $this->_height = $height ? $height : null;
                $this->_thumbnailImageWidth =
                    (int)$configHelper->getDevConfig('thumbnail_image_width');
                $this->_thumbnailImageHeight =
                    (int)$configHelper->getDevConfig('thumbnail_image_height');

                $this->_zoomImages = array();
                $this->_keepFrame = (bool)$configHelper->getDevConfig('image_keep_frame');
                break;
            case self::TYPE_LIST:
                $listImageWidth = (int)$configHelper->getDevConfig('list_image_width');
                $listImageHeight = (int)$configHelper->getDevConfig('list_image_height');
                $this->_listImageWidth = $listImageWidth ? $listImageWidth : null;
                $this->_listImageHeight = $listImageHeight ? $listImageHeight : null;
                $this->_keepFrame = $mode != 'grid' ? false : true;
        endswitch;
        return $this;
    }

    /**
     * @param $image Mage_Catalog_Helper_Image
     * @param $width int | null
     * @param $height int | null
     * @return string
     */
    protected function _resizeImage($image, $width, $height = null)
    {
        if (!$width) {
            return (string)$image;
        } else {
            return (string)$image->keepFrame($this->_keepFrame)->constrainOnly(true)->resize($width, $height);
        }
    }

    public function prepareOptions($params)
    {
        $paramsInStr = '';
        foreach ($params['super_attribute'] as $key => $value) {
            $paramsInStr .= $key . '=' . $value . '&';
        }
        $paramsInStr = substr($paramsInStr, 0, -1);
        return '?options=' . serialize($params['options']) . '#' . $paramsInStr;
    }
}