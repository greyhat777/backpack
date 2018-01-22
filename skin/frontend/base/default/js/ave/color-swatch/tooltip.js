if (typeof Ave == 'undefined') {
    var Ave = {};
}
Ave.Tooltip = Class.create(Tooltip, {
    initialize: function(element, tool_tip) {
        var options = Object.extend({
            default_css: false,
            margin: "0px",
            padding: "5px",
            backgroundColor: "#d6d6fc",
            min_distance_x: 5,
            min_distance_y: 5,
            delta_x: 0,
            delta_y: 0,
            zindex: 1000
        }, arguments[2] || {});
        this.element      = element;
        this.options      = options;
        // use the supplied tooltip element or create our own div
        if($(tool_tip)) {
            this.tool_tip = $(tool_tip);
        } else {
            this.tool_tip = $(document.createElement("div"));
            document.body.appendChild(this.tool_tip);
            this.tool_tip.addClassName("tooltip");
            this.tool_tip.appendChild(document.createTextNode(tool_tip));
        }

        // hide the tool-tip by default
        this.tool_tip.hide();

        this.eventMouseOver = this.showTooltip.bindAsEventListener(this);
        this.eventMouseOut   = this.hideTooltip.bindAsEventListener(this);
        this.eventMouseMove  = this.moveTooltip.bindAsEventListener(this);

        this.registerEvents();
    },
    moveTooltip: function(event){
        Event.stop(event);
        // get Mouse position
        var mouse_x =   Event.pointerX(event);
        var mouse_y = event.clientY;
        var mouse_y_body = Event.pointerY(event);

        // decide if wee need to switch sides for the tooltip
        var dimensions = Element.getDimensions( this.tool_tip );
        var element_width = dimensions.width;
        var element_height = dimensions.height;
        if ( (element_width + mouse_x) >= ( this.getWindowWidth() - this.options.min_distance_x) ){ // too big for X
            mouse_x = mouse_x - element_width;
            // apply min_distance to make sure that the mouse is not on the tool-tip
            mouse_x = mouse_x - this.options.min_distance_x;
        } else {
            mouse_x = mouse_x + this.options.min_distance_x;
        }

        if ((mouse_y + element_height + this.options.min_distance_y) >= this.getWindowHeight()) {
            mouse_y_body = mouse_y_body - element_height - this.options.min_distance_y;
        } else {
            mouse_y_body = mouse_y_body + this.options.min_distance_y;
        }
        // now set the right styles
        this.setStyles(mouse_x, mouse_y_body);
    }
});