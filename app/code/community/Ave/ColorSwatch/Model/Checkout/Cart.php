<?php

class Ave_ColorSwatch_Model_Checkout_Cart extends Mage_Checkout_Model_Cart
{

    public function save()
    {
        Mage::dispatchEvent('checkout_cart_save_before', array('cart' => $this));
        $this->getQuote()->getBillingAddress();
        $this->getQuote()->getShippingAddress()->setCollectShippingRates(true);
        $this->getQuote()->collectTotals();
        $this->getQuote()->save();
        $this->getCheckoutSession()->setQuoteId($this->getQuote()->getId());
        Mage::dispatchEvent('checkout_cart_save_after', array('cart' => $this));
        if (Mage::helper('ave_colorswatch/config')->getDevConfig('use_price_simple') == 1) {
            foreach ($this->getQuote()->getAllItems() as $_item) {
                $_item->setCustomPrice($_item->getPrice());
                $_item->setRowTotal($_item->getPrice() * $_item->getQty());
                $_item->setBaseRowTotal($_item->getBasePrice() * $_item->getQty());
                $_item->setOriginalCustomPrice($_item->getCustomPrice());
                $_item->setCalculationPrice($_item->getCustomPrice());
            }
        }
        return $this;
    }

    public function saveSpecial()
    {
        Mage::dispatchEvent('checkout_cart_save_before', array('cart' => $this));
        $this->getQuote()->getBillingAddress();
        $this->getQuote()->getShippingAddress()->setCollectShippingRates(true);
        $this->getQuote()->collectTotals();
        $this->getQuote()->save();
        $this->getCheckoutSession()->setQuoteId($this->getQuote()->getId());
        /**
         * Cart save usually called after changes with cart items.
         */
        Mage::dispatchEvent('checkout_cart_save_after', array('cart' => $this));
        return $this;
    }
}