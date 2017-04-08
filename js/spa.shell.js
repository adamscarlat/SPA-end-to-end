/*
* spa.shell.js
* Shell module for SPA
*/      

spa.shell = (function () {
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var configMap = {
        //define the map used by uriAnchor for validation
        anchor_schema_map : {
            chat : { open : true, closed : true }
        },
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
        anchor_map : {},
        is_chat_retracted : true, 
    },

    //cache for jQuery collection object- 
    //reduce the number of jQuery document transversals and improve performance.
    jqueryMap = {},

    //module scope variables
    onclickChat, toggleChat, setJqueryMap, initModule,
    copyAnchorMap, changeAnchorPart, onHashchange;

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //-------------------- BEGIN UTILITY METHODS -----------------
    //functions that do not interact with page elements

    // Returns copy of stored anchor map; minimizes overhead
    copyAnchorMap = function () {
        return $.extend( true, {}, stateMap.anchor_map );
    };
    //--------------------- END UTILITY METHODS ------------------

    //--------------------- BEGIN DOM METHODS --------------------
    //functions that create and manipulate DOM elements

    // Begin DOM method /changeAnchorPart/
    // Purpose : Changes part of the URI anchor component
    // Arguments:
    //   * arg_map - The map describing what part of the URI anchor
    //     we want changed.
    // Returns : boolean
    //   * true - the Anchor portion of the URI was update
    //   * false - the Anchor portion of the URI could not be updated
    // Action :
    //   The current anchor rep stored in stateMap.anchor_map.
    //   See uriAnchor for a discussion of encoding.
    //   This method
    //     * Creates a copy of this map using copyAnchorMap().
    //     * Modifies the key-values using arg_map.
    //     * Manages the distinction between independent and dependent values in the encoding.
    //     * Attempts to change the URI using uriAnchor.
    //     * Returns true on success, and false on failure.

    changeAnchorPart = function ( arg_map ) {

        var
        anchor_map_revise = copyAnchorMap(),
        bool_return = true,
        key_name, key_name_dep;
        // Begin merge changes into anchor map
        KEYVAL:
            for ( key_name in arg_map ) {
                if ( arg_map.hasOwnProperty( key_name ) ) {
                    // skip dependent keys during iteration
                    if ( key_name.indexOf( '_' ) === 0 ) { continue KEYVAL; }
                    // update independent key value
                    anchor_map_revise[key_name] = arg_map[key_name];
                    // update matching dependent key
                    key_name_dep = '_' + key_name;
                    if ( arg_map[key_name_dep] ) {
                        anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                    }
                    else {
                        delete anchor_map_revise[key_name_dep];
                        delete anchor_map_revise['_s' + key_name_dep];
                    } 
                }
            }
        // End merge changes into anchor map

        // Begin attempt to update URI; revert if not successful
        try {
            $.uriAnchor.setAnchor( anchor_map_revise );
        }
        catch ( error ) {
            // replace URI with existing state
            $.uriAnchor.setAnchor( stateMap.anchor_map,null,true );
            bool_return = false;
        }
        // End attempt to update URI...
        return bool_return;
    };
    // End DOM method /changeAnchorPart/


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
    // Begin Event handler /onHashchange/
    // Purpose : Handles the hashchange event
    // Arguments:
    //   * event - jQuery event object.
    // Settings : none
    // Returns  : false
    // Action   :
    //   * Parses the URI anchor component
    //   * Compares proposed application state with current
    //   * Adjust the application only where proposed state
    //     differs from existing
    //
    onHashchange = function ( event ) {
        var
            anchor_map_previous = copyAnchorMap(),
            anchor_map_proposed,
            _s_chat_previous, _s_chat_proposed,
            s_chat_proposed;

        // attempt to get new anchor map 
        try { 
            anchor_map_proposed = $.uriAnchor.makeAnchorMap(); 
        }
        catch ( error ) {
            //if falied, revert to old anchor map
            $.uriAnchor.setAnchor( anchor_map_previous, null, true );
            return false;
        }

        //update the shell anchor map
        stateMap.anchor_map = anchor_map_proposed;

        // convenience vars - old and new chat states
        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;

        // Begin adjust chat component if changed
        if ( ! anchor_map_previous || _s_chat_previous !== _s_chat_proposed ) {

            s_chat_proposed = anchor_map_proposed.chat;
            switch ( s_chat_proposed ) {
                case 'open' :
                    toggleChat( true );
                    break;
                case 'closed' :
                    toggleChat( false );
                    break;
                default :
                    toggleChat( false );
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
            } 
        }

        return false;
    };
    // End Event handler /onHashchange/

   // Begin Event handler /onClickChat/
    onClickChat = function ( event ) {
        changeAnchorPart({
            chat: ( stateMap.is_chat_retracted ? 'open' : 'closed' )
        });
        //return false to stop this event from bubbling to parent element and concludes jQuery event execution 
        return false;
    };
    // End Event handler /onClickChat/

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
        
        // configure uriAnchor to use our schema 
        $.uriAnchor.configModule({
            schema_map : configMap.anchor_schema_map
        });

        // Handle URI anchor change events.
        // This is done /after/ all feature modules are configured
        // and initialized, otherwise they will not be ready to handle
        // the trigger event, which is used to ensure the anchor
        // is considered on-load.
        //
        //hashchange is the built in event for # changing in the URI. We attache an event handler to it.
        //Events that are affect URI anchors will be handled differently:
        //  1. on click- anchor changes accordingly
        //  2. anchor change event fires - this toggles their correct event handler

        $(window)
            .bind( 'hashchange', onHashchange ) //'this' object inside onHashChange will be the window object
            .trigger( 'hashchange' );

    };

    return { initModule : initModule };

})()    