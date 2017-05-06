/*
 * app.js - Simple express server
*/

// ------------ BEGIN MODULE SCOPE VARIABLES --------------
'use strict';
var
  http    = require( 'http'    ),
  express = require( 'express' ),
  routes = require( './routes' ),
  app     = express(),
  server  = http.createServer( app );

routes.configRoutes(app, server);

// ------------- END MODULE SCOPE VARIABLES ---------------

// ------------- BEGIN SERVER CONFIGURATION ---------------

//to switch environment: in the terminal- 
//$>NODE_ENV=production node app.js

//any environment configuration
app.configure( function () {
  app.use( express.bodyParser() );
  app.use( express.methodOverride() );
  app.use( express.static( __dirname + '/public' ) ); 
  app.use( app.router );
});

//dev environment- show exception stack traces
app.configure( 'development', function () {
  app.use( express.logger() );
  app.use( express.errorHandler({
    dumpExceptions : true,
    showStack      : true
  }) );
});

//production environment- errors do not show
app.configure( 'production', function () {
  app.use( express.errorHandler() );
});

routes.configRoutes( app, server );

// -------------- END SERVER CONFIGURATION ----------------

// ----------------- BEGIN START SERVER -------------------
server.listen( 3000 );
console.log(
  'Express server listening on port %d in %s mode',
   server.address().port, app.settings.env
);
// ------------------ END START SERVER --------------------
