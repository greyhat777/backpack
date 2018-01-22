function initTabColorOptions ()
{
    var tabsNavigation = $$('ul#product_attribute_tabs > li');
    var tabId = 'product_attribute_tabs_ave_color_swatch';
    var tabColorOption;
    for (var i = 0; i < tabsNavigation.length; i++) {
        var link = tabsNavigation[i].getElementsByTagName('a')[0];
        if (tabId == link.getAttribute("id")) {
            tabColorOption = tabsNavigation[i];
            tabColorOption.show();
            tabColorOption.parentNode.appendChild(tabColorOption);
            break;
        }
    }
}

document.observe('dom:loaded', function () {
    initTabColorOptions();
});