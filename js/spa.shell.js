/*
* spa.shell.js
* Shell module for SPA
*/      

spa.shell = (function () {
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var configMap = {
        main_html : String() 
            + "<div class=\"spa-shell-head\">"
                + "    <div class=\"spa-shell-head-logo\"><\/div>"
                + "    <div class=\"spa-shell-head-acct\"><\/div>"
                + "    <div class=\"spa-shell-head-search\"><\/div>"
            + "<\/div>"
            + "<div class=\"spa-shell-main\">"
                + "    <div class=\"spa-shell-main-nav\"><\/div>"
                + "    <div class=\"spa-shell-main-content\"><\/div>"
            + "<\/div>"
            + "<div class=\"spa-shell-foot\"><\/div>"
            + "<div class=\"spa-shell-chat\"><\/div>"
            + "<div class=\"spa-shell-modal\"><\/div>"
    },

    //dynamic info shared accorss module
    stateMap  = { $container : null },

    //cache for jQuery collection object- 
    //reduce the number of jQuery document transversals and improve performance.
    jqueryMap = {},

    //module scope variables
    setJqueryMap, initModule;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //-------------------- BEGIN UTILITY METHODS -----------------
    //functions that do not interact with page elements
    //--------------------- END UTILITY METHODS ------------------

    //--------------------- BEGIN DOM METHODS --------------------
    //functions that create and manipulate DOM elements

    //assigns jQuery elements to the jQuery cache
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = { $container : $container };
    };
    //--------------------- END DOM METHODS ----------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    //jQuery event handler functions
    //-------------------- END EVENT HANDLERS --------------------

    //------------------- BEGIN PUBLIC METHODS -------------------
    initModule = function ( $container ) {
        stateMap.$container = $container;
        $container.html( configMap.main_html );
        setJqueryMap();
    };

    return { initModule : initModule };

})()    