/*
* spa.shell.js
* Shell module for SPA
*/      

spa.shell = (function () {
    //'use strict';
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var configMap = {
        //define the map used by uriAnchor for validation
        anchor_schema_map : {
            chat : { opened : true, closed : true }
        },
        main_html : String() 
            + '<div class="spa-shell-head-logo">'
                + '<h1>SPA</h1>'
                + '<p>javascript end to end</p>'
            + '</div>'
            + '<div class="spa-shell-head-acct"></div>'
            + "<div class=\"spa-shell-main\">"
                + "    <div class=\"spa-shell-main-nav\"><\/div>"
                + "    <div class=\"spa-shell-main-content\"><\/div>"
            + "<\/div>"
            + "<div class=\"spa-shell-foot\"><\/div>"
            + "<div class=\"spa-shell-modal\"><\/div>",

        
        //chat slider configurations
        chat_extend_time : 250, 
        chat_retract_time : 300, 
        chat_extend_height : 450, 
        chat_retract_height : 15,
        chat_extended_title  : 'Click to retract',
        chat_retracted_title : 'Click to extend',
        resize_interval : 200,

    },

    //dynamic info shared accorss module
    stateMap  = { 
        anchor_map : {},
        $container : undefined,
        resize_idto : undefined
    },

    //cache for jQuery collection object- 
    //reduce the number of jQuery document transversals and improve performance.
    jqueryMap = {},

    //module scope variables
    onclickChat, toggleChat, setJqueryMap, initModule, setChatAnchor,
    copyAnchorMap, changeAnchorPart, onHashchang, onResize,
    onTapAcct, onLogin, onLogout;

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
            $acct : $container.find('.spa-shell-head-acct'),
            $nav : $container.find('.spa-shell-main-nav')
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
      
    /*
    On clicking the account, if the user is anonymous- start sign in process.
    If the user is signed in, logout.
    */
    onTapAcct = function ( event ) {
        var acct_text, user_name, user = spa.model.people.get_user();

        if ( user.get_is_anon() ) {
            user_name = prompt( 'Please sign-in' );
            spa.model.people.login( user_name );
            jqueryMap.$acct.text( '... processing ...' );
        }
        else {
            spa.model.people.logout();
        }
        return false;
    };

    //event to update the user area in the UI after login
    onLogin = function ( event, login_user ) {
        jqueryMap.$acct.text( login_user.name );
    };

    //event to update the user area in the UI after logout
    onLogout = function ( event, logout_user ) {
        jqueryMap.$acct.text( 'Please sign-in' );
    };

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
            _s_chat_previous, _s_chat_proposed, s_chat_proposed,
            anchor_map_proposed,
            is_ok = true,
            anchor_map_previous = copyAnchorMap();

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
                case 'opened' :
                    is_ok = spa.chat.setSliderPosition( 'opened' );
                    break;
                case 'closed' :
                    is_ok = spa.chat.setSliderPosition( 'closed' );
                    break;
                default :
                    spa.chat.setSliderPosition( 'closed' );
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
            } 
        }
        // Begin revert anchor if slider change denied
        if ( ! is_ok ) {
            if ( anchor_map_previous ) {
                $.uriAnchor.setAnchor( anchor_map_previous, null, true );
                stateMap.anchor_map = anchor_map_previous;
            } 
            else {
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
            }
        }
        // End revert anchor if slider change denied
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

    // Begin Event handler /onResize/
    onResize = function (){
        if ( stateMap.resize_idto ){ return true; }

        spa.chat.handleResize();
            stateMap.resize_idto = setTimeout(
            function (){ stateMap.resize_idto = undefined; },
            configMap.resize_interval
        );
        return true;
    };
    // End Event handler /onResize/

    //-------------------- END EVENT HANDLERS --------------------

    //---------------------- BEGIN CALLBACKS ---------------------

    // Begin callback method /setChatAnchor/
    // Example : setChatAnchor( 'closed' );
    // Purpose : Change the chat component of the anchor
    // Arguments:
    //      * position_type - may be 'closed' or 'opened'
    // Action :
    //      Changes the URI anchor parameter 'chat' to the requested
    //      value if possible.
    // Returns :
    //      * true - requested anchor part was updated
    //      * false - requested anchor part was not updated
    // Throws : none
    //
    setChatAnchor = function ( position_type ){
        return changeAnchorPart({ chat : position_type });
    };
    // End callback method /setChatAnchor/
    //----------------------- END CALLBACKS ----------------------

    //------------------- BEGIN PUBLIC METHODS -------------------
    // Example : spa.shell.initModule( $('#app_div_id') );
    // Purpose :
    // Directs the Shell to offer its capability to the user
    // Arguments :
    //      * $container (example: $('#app_div_id')).
    //          A jQuery collection that should represent a single DOM container
    // Action :
    //       Populates $container with the shell of the UI
    //       and then configures and initializes feature modules.
    //       The Shell is also responsible for browser-wide issues
    //       such as URI anchor and cookie management.
    // Returns : none
    // Throws : none
    //
    initModule = function ( $container ) {
        stateMap.$container = $container;
        $container.html( configMap.main_html );
        setJqueryMap();
        
        // housekeeping here ...
        // configure and initialize feature modules
        
        // configure uriAnchor to use our schema 
        $.uriAnchor.configModule({
            schema_map : configMap.anchor_schema_map
        });

        // configure and initialize feature modules

        //configure and initialize the chat feature
        spa.chat.configModule({
            set_chat_anchor : setChatAnchor,
            chat_model : spa.model.chat,
            people_model : spa.model.people
        });
        spa.chat.initModule( jqueryMap.$container );

        //configure and initialize the avatar feature
        spa.avtr.configModule({
            chat_model : spa.model.chat,
            people_model : spa.model.people
        });
        spa.avtr.initModule( jqueryMap.$nav );

        // Handle URI anchor change events.
        // This is done /after/ all feature modules are configured
        // and initialized, otherwise they will not be ready to handle
        // the trigger event, which is used to ensure the anchor
        // is considered on-load.
        //
        //hashchange is the built in event for # changing in the URI. We attach an event handler to it.
        //Events that are affect URI anchors will be handled differently:
        //  1. on click- anchor changes accordingly
        //  2. anchor change event fires - this toggles their correct event handler

        $(window)
            .bind( 'resize', onResize )
            .bind( 'hashchange', onHashchange ) //this bind is a jQuery function (not to be confused with the JS bind)
            .trigger( 'hashchange' );
        
        //register to the model's login and logout events. They will fire after login and logout 
        // and call the given callback
        $.gevent.subscribe( $container, 'spa-login', onLogin );
        $.gevent.subscribe( $container, 'spa-logout', onLogout );

        //init the user area in the UI. bind an event handler to a click on it
        jqueryMap.$acct
            .text( 'Please sign-in')
            .bind( 'utap', onTapAcct );

    };

    return { initModule : initModule };

})()    