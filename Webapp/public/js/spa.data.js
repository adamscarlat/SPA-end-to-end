/*
    * spa.data.js
    * Data module
*/

spa.data = (function () {
  'use strict';
  var
    stateMap = { sio : null },
    makeSio, getSio, initModule;

  makeSio = function (){
    var socket = io.connect( '/chat' );

    return {
      emit : function ( event_name, data ) {
        socket.emit( event_name, data );
      },
      on   : function ( event_name, callback ) {
        socket.on( event_name, function (){
          callback( arguments );
        });
      }
    };
  };

  getSio = function (){
    if ( ! stateMap.sio ) { stateMap.sio = makeSio(); }
    return stateMap.sio;
  };

  initModule = function (){};

  return {
    getSio     : getSio,
    initModule : initModule
  };
}());
