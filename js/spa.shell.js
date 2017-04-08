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
            + "<div class=\"spa-shell-modal\"><\/div>",

            //chat slider configurations
            chat_extend_time : 1000, 
            chat_retract_time : 300, 
            chat_extend_height : 450, 
            chat_retract_height : 15
    },

    //dynamic info shared accorss module
    stateMap  = { $container : null },

    //cache for jQuery collection object- 
    //reduce the number of jQuery document transversals and improve performance.
    jqueryMap = {},

    //module scope variables
    toggleChat, setJqueryMap, initModule;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //-------------------- BEGIN UTILITY METHODS -----------------
    //functions that do not interact with page elements
    //--------------------- END UTILITY METHODS ------------------

    //--------------------- BEGIN DOM METHODS --------------------
    //functions that create and manipulate DOM elements

    //assigns jQuery elements to the jQuery cache
    setJqueryMap = function () {
        var $container = stateMap.$container;

        jqueryMap = {
            $container : $container,
            $chat : $container.find( '.spa-shell-chat' )
        };
    };

    // Begin DOM method /toggleChat/
    // Purpose   : Extends or retracts chat slider
    // Arguments :
    //   * do_extend - if true, extends slider; if false retracts
    //   * callback  - optional function to execute at end of animation
    // Settings  :
    //   * chat_extend_time, chat_retract_time
    //   * chat_extend_height, chat_retract_height
    // Returns   : boolean
    //   * true  - slider animation activated
    // * false - slider animation not activated  
    toggleChat=function(do_extend,callback) {
        var
            px_chat_ht = jqueryMap.$chat.height(),
            is_open = px_chat_ht === configMap.chat_extend_height,
            is_closed = px_chat_ht === configMap.chat_retract_height,
            is_sliding = ! is_open && ! is_closed;
       
        // avoid race condition - if chat is currently in motion, abort
        if ( is_sliding ){ return false; }    
        
        // Begin extend chat slider
        if ( do_extend ) {
            jqueryMap.$chat.animate(
                { height : configMap.chat_extend_height },
                configMap.chat_extend_time,
                function () {
                    if ( callback ){ callback( jqueryMap.$chat ); }
                }
            );
            return true;
        }
        //End extend chat slider

        // Begin retract chat slider
        jqueryMap.$chat.animate(
            { height : configMap.chat_retract_height },
            configMap.chat_retract_time,
            function () {
                if ( callback ){ callback( jqueryMap.$chat ); }
            }
            );
            return true;
        // End retract chat slider
    };
    //End toggleChat
      

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