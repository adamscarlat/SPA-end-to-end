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
            chat_extend_time : 250, 
            chat_retract_time : 300, 
            chat_extend_height : 450, 
            chat_retract_height : 15,
            chat_extended_title  : 'Click to retract',
            chat_retracted_title : 'Click to extend'
    },

    //dynamic info shared accorss module
    stateMap  = { 
        $container : null,
        is_chat_retracted : true, 
    },

    //cache for jQuery collection object- 
    //reduce the number of jQuery document transversals and improve performance.
    jqueryMap = {},

    //module scope variables
    onclickChat, toggleChat, setJqueryMap, initModule;

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
                //animate callback
                function () {
                    jqueryMap.$chat.attr('title', configMap.chat_extended_title);
                    stateMap.is_chat_retracted = false;
                    if ( callback ){ callback( jqueryMap.$chat ); } //user defined callback 
                }
            );
            return true;
        }
        //End extend chat slider

        // Begin retract chat slider
        jqueryMap.$chat.animate(
            { height : configMap.chat_retract_height },
            configMap.chat_retract_time,
            //animate callback            
            function () {
                jqueryMap.$chat.attr('title', configMap.chat_retracted_title);
                stateMap.is_chat_retracted = true;
                if ( callback ){ callback( jqueryMap.$chat ); } //user defined callback 
            }
        );
            return true;
        // End retract chat slider
    };
    //End toggleChat
      

    //--------------------- END DOM METHODS ----------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    //jQuery event handler functions
    onClickChat = function ( event ) {
        toggleChat( stateMap.is_chat_retracted );

        //return false to stop this event from bubbling to parent element and concludes jQuery event execution 
        return false;
    };

    //-------------------- END EVENT HANDLERS --------------------

    //------------------- BEGIN PUBLIC METHODS -------------------
    initModule = function ( $container ) {
        stateMap.$container = $container;
        $container.html( configMap.main_html );
        setJqueryMap();

        //set chat initial state, tool tip text, and event handlers
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr( 'title', configMap.chat_retracted_title )
            .click( onClickChat );

    };

    return { initModule : initModule };

})()    