
/*
The cascade in the spa client is that each element configs and initializes the next element.
While initializing it, it also passes to it a div container to work with.

ex: 
spa --> (#spa) --> spa.shell --> (#chat) -->  spa.chat

spa passes a main div element to the shell to work with. The shell then configures and initializes the
shell (using configModule and initModule as well). Other than a div to work with, It passes to the shell a callback, setChatAnchor, that will
run when the chat state is changed. This call back will change the anchor accordingly.

When the user clicks on the chat toggle button, the chat uses setChatAnchor callback and returns. The shell still handles hashchanges events.
when the user clicks on the slider, the hashchange event is caught by the Shell, which dispatches to the onHashchange event handler.
If the chat component of the URI anchor has changed, this routine calls spa.chat.setSliderPosition to request the new position.


*/

//spa namespace
var spa = (function () {
    // housekeeping here ...

    // if we needed to configure the Shell,
    // we would invoke spa.shell.configModule first

    var initModule = function ( $container ) {
        spa.shell.initModule( $container );
    };

    return { initModule: initModule };

}());