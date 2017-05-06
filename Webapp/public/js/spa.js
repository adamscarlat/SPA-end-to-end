
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

--Model
The model is in charge to organize the data returned from the server as objects that can be added to the UI.
Also, it has methods for user authentication. The model works with services that communicate with the server. 
It publishes events at certain times. For example, upon successfult login:

people model
1. user supplies creds 
2. model uses socket IO to pass data to server (also supplies a callback when backend auth is complete)
3. when backend is done, callback runs and publishes the spa-login event. It sends the new user data as event parameters
4. shell is subscribed to spa-login.

chat model - new user
1. a logged in user joins chat. the chat model subscribes a list-change callback with the server
2. server respond to the new callback by firing it and sending it the new list of people (to all logged in users?)
3. chat model updates its people's list accordingly

chat model- messaging
1. when a user logged in he registers callbacks on the sio. callbacks are: listchange and updatechat
2. user chooses a chatee to chat with. this publishes an event spa-setchatee with old and new chattees as params
3. user sends message to chatee. this emits an updatechat to sio. sio calls callback that was registered

*/

//spa namespace
var spa = (function () {
    'use strict';
    // housekeeping here ...

    // if we needed to configure the Shell,
    // we would invoke spa.shell.configModule first

    var initModule = function ( $container ) {
        spa.data.initModule();
        spa.model.initModule();
        spa.shell.initModule( $container );
    };

    return { initModule: initModule };

}());