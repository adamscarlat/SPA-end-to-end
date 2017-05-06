

'use strict';
var configRoutes;

configRoutes = function ( app, server ) {

    app.get( '/', function ( request, response ) {
        console.log(__dirname + '/public');
        response.redirect( '/spa.html' );
    });

    //intercept all request types and add these headers.
    // /user/*?, the * will match anything and the ? makes it optional.
    app.all( '/:obj_type/*?', function ( request, response, next ) {
        response.contentType( 'json' );
        next();
    });

    app.get( '/:obj_type/list', function ( request, response ) {
        response.send({ title: 'user list' });
    });

    app.post( '/:obj_type/create', function ( request, response ) {
        response.send({ title: 'user created' });
    });

    //localhost:3000/user/read/12
    app.get( '/:obj_type/read/:id([0-9]+)', function ( request, response ) {
        response.send({
            title: request.params.obj_type + ' with id ' + request.params.id + ' found'
        });
    });

    app.post( '/:obj_type/update/:id([0-9]+)',
    function ( request, response ) {
            response.send({
            title: request.params.obj_type + ' with id ' + request.params.id + ' updated'
        });
    });

    app.get( '/:obj_type/delete/:id([0-9]+)',
    function ( request, response ) {
            response.send({
            title: request.params.obj_type + ' with id ' + request.params.id + ' deleted'
        });
    });

}


//The value assigned to the module.exports attribute is provided as the return value of the require method.
//The module.exports value can be any data type such as a function, object, array, string, number, or boolean. 
//In this case, routes.js sets the value of module.exports to an anonymous function
module.exports = { configRoutes : configRoutes };