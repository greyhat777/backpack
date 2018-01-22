Ave_Color_Swatch_Config = Class.create();

Ave_Color_Swatch_Config.prototype = {
    initialize:function(form){
        var showTooltipSelect = $('ave_color_swatch_product_view_group_product_show_tooltip');
        var showListSelect = $('ave_color_swatch_product_list_group_list_module_enable');
        var showSectionSelect = $('ave_color_swatch_product_view_group_product_module_enable');
        this.toggleIPlist();
        this.toggleSection();
        this.toggleListSection();
        Event.observe(showListSelect, 'change', this.toggleListSection);
        Event.observe(showSectionSelect, 'change', this.toggleSection);
        Event.observe(showTooltipSelect, 'change', this.toggleIPlist);
    },

    toggleIPlist:function(){
        var showTooltipSelect = $('ave_color_swatch_product_view_group_product_show_tooltip');
        var showTooltip = showTooltipSelect.options[showTooltipSelect.selectedIndex].value;
        if(showTooltip == 0){
            $('row_ave_color_swatch_product_view_group_product_tooltip_width').addClassName('no-display');
            $('row_ave_color_swatch_product_view_group_product_tooltip_height').addClassName('no-display');
        }
        else{
            $('row_ave_color_swatch_product_view_group_product_tooltip_width').removeClassName('no-display');
            $('row_ave_color_swatch_product_view_group_product_tooltip_height').removeClassName('no-display');
        }
    },
    toggleSection: function () {
        var showSectionSelect = $('ave_color_swatch_product_view_group_product_module_enable');
        var showSection = showSectionSelect.options[showSectionSelect.selectedIndex].value;
        var allSectionRows = $$('#row_ave_color_swatch_product_view_group_product_module_enable').first().parentNode;
        allSectionRows = allSectionRows.select('tr');
        if (showSection == 0) {
            allSectionRows.each(function (e) {
                if (e.id != 'row_ave_color_swatch_product_view_group_product_module_enable') {
                    e.addClassName('no-display')
                }
            });
        } else {
            allSectionRows.each(function (e) {
                e.removeClassName('no-display');
            });
        }
    },
    toggleListSection: function () {
        var showSectionSelect = $('ave_color_swatch_product_list_group_list_module_enable');
        var showSection = showSectionSelect.options[showSectionSelect.selectedIndex].value;
        var allSectionRows = $$('#row_ave_color_swatch_product_list_group_list_module_enable').first().parentNode;
        allSectionRows = allSectionRows.select('tr');
        if (showSection == 0) {
            allSectionRows.each(function (e) {
                if (e.id != 'row_ave_color_swatch_product_list_group_list_module_enable') {
                    e.addClassName('no-display')
                }
            });
        } else {
            allSectionRows.each(function (e) {
                e.removeClassName('no-display');
            });
        }
    }
};

document.observe('dom:loaded', function () {
        var cp_config = new Ave_Color_Swatch_Config($('config_edit_form').serialize(true));
    }
);

function flushAttributeCacheImages(flushUrl, targetButton)
{
    if (targetButton.className.indexOf('disabled') != -1) {
        return false;
    }
    if (confirm('Do you want flush attribute cache images?')) {
        new Ajax.Request(flushUrl, {
            method: 'post',
            parameters: {},
            onSuccess: function(data){
                var response = data['responseText'].evalJSON();
                if (response.status == 'success') {
                    targetButton.className = targetButton.className + " disabled";
                }
            }
        });
    }
    return false;
}
