/*
* spa.model.js
* Model module

TaffyDb is a browser database. 
usage: 
$> var peopleDb = spa.model.people.get_db(); //get the taffy (see module below for get_db())
$> var peopleList = peopleDb().get();
$> peopleDb().each(function(person, idx){console.log(person.name);});
$> var person = peopleDb({ cid : 'id_03' }).first(); //find by id
$>

*/


// The people object API
// ---------------------
// The people object is available at spa.model.people.
// The people object provides methods and events to manage
// a collection of person objects. Its public methods include:
//      * get_user() - return the current user person object.
//          If the current user is not signed-in, an anonymous person
//          object is returned.
//      * get_db() - return the TaffyDB database of all the person
//          objects - including the current user - presorted.
//          * get_by_cid( <client_id> ) - return a person object with
//              provided unique id.
//      * login( <user_name> ) - login as the user with the provided
//          user name. The current user object is changed to reflect
//          the new identity. Successful completion of login
//          publishes a 'spa-login' global custom event.
//      * logout()- revert the current user object to anonymous.
//          This method publishes a 'spa-logout' global custom event.
//
// jQuery global custom events published by the object include:
//      * spa-login - This is published when a user login process
//          completes. The updated user object is provided as data.
//      * spa-logout - This is published when a logout completes.
//          The former user object is provided as data.
//
// Each person is represented by a person object.
// Person objects provide the following methods:
//      * get_is_user() - return true if object is the current user
//      * get_is_anon() - return true if object is anonymous
//
// The attributes for a person object include:
//      * cid - string client id. This is always defined, and
//          is only different from the id attribute
//          if the client data is not synced with the backend.
//      * id - the unique id. This may be undefined if the
//          object is not synced with the backend.
//      * name - the string name of the user.
//      * css_map - a map of attributes used for avatar presentation.
//


spa.model = (function () {   
    'use strict';
    var
        configMap = { anon_id : 'a0' },

        stateMap = {
            anon_user : null,
            cid_serial : 0,
            people_cid_map : {},
            people_db : TAFFY(),
            user : null
        },

        isFakeData = true,

        makeCid, clearPeopleDb, completeLogin, removePerson,
        personProto, makePerson, people, initModule;

        //person prototype
        personProto = {
            get_is_user : function () {
                return this.cid === stateMap.user.cid;
            },
            get_is_anon : function () {
                return this.cid === stateMap.anon_user.cid;
            }
        };

        //generate a serial client id
        makeCid = function () {
            return 'c' + String( stateMap.cid_serial++ );
        };

        //clear user db and map except anonymous user and 
        //signed in user
        clearPeopleDb = function () {
            var user = stateMap.user;
            stateMap.people_db = TAFFY();
            stateMap.people_cid_map = {};
            if ( user ) {
                stateMap.people_db.insert( user );
                stateMap.people_cid_map[ user.cid ] = user;
            }
        };

        //update user info after login completion and publish to 
        //'spa-login' subscribers. This method serves as a callback. It receives
        //updated data from the server and updates the user
        completeLogin = function ( user_list ) {
            var user_map = user_list[ 0 ];
            delete stateMap.people_cid_map[ user_map.cid ];

            stateMap.user.cid = user_map._id;
            stateMap.user.id = user_map._id;
            stateMap.user.css_map = user_map.css_map;
            stateMap.people_cid_map[ user_map._id ] = stateMap.user;

            // When we add chat, we should join here
            $.gevent.publish( 'spa-login', [ stateMap.user ] );
        };

        //Create new Person object. 
        //store it in taffy db.
        //store it in a <id, person> map
        makePerson = function ( person_map ) {
            var person,
            cid = person_map.cid,
            css_map = person_map.css_map,
            id = person_map.id,
            name = person_map.name;

            if ( cid === undefined || ! name ) {
                throw 'client id and name required';
            }

            person = Object.create( personProto );
            person.cid = cid;
            person.name = name;
            person.css_map = css_map;

            if ( id ) { person.id = id; }

            stateMap.people_cid_map[ cid ] = person;
            stateMap.people_db.insert( person );
            return person;
        };

        //remove person from db and list
        removePerson = function ( person ) {
            if ( ! person ) { return false; }

            // can't remove anonymous person
            if ( person.id === configMap.anon_id ) {
                return false;
            }

            stateMap.people_db({ cid : person.cid }).remove();

            if ( person.cid ) {
                delete stateMap.people_cid_map[ person.cid ];
            }

            return true;
        };

        //People API
        people = (function () {
            var get_by_cid, get_db, get_user, login, logout;

            get_by_cid = function ( cid ) {
                return stateMap.people_cid_map[ cid ];
            };

            get_db = function () { return stateMap.people_db; };

            get_user = function () { return stateMap.user; };
            
            //simple login for testing (no credentials checking...)
            login = function ( name ) {
                var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

                stateMap.user = makePerson({
                    cid : makeCid(),
                    css_map : {top : 25, left : 25, 'background-color':'#8f8'},
                    name : name
                })

                //a callback to complete sign-in when backend publishes userupdate event
                sio.on( 'userupdate', completeLogin );
                
                //send an adduser to backend to add the user 
                sio.emit( 'adduser', {
                    cid : stateMap.user.cid,
                    css_map : stateMap.user.css_map,
                    name : stateMap.user.name
                });
            };

            //remove user from db and list. publish spa-logout event
            logout = function () {
                var is_removed, user = stateMap.user;

                // when we add chat, we should leave the chatroom here
                is_removed = removePerson( user );

                stateMap.user = stateMap.anon_user;
                $.gevent.publish( 'spa-logout', [ user ] );

                return is_removed;
            };

            return {
                get_by_cid : get_by_cid,
                get_db : get_db,
                get_user : get_user,
                login : login,
                logout : logout
            };
        })();

        //initiate model with an anonymous user.
        //if fake data provided, add it to people db and list
        initModule = function () {
            var i, people_list, person_map;
                
                // initialize anonymous person
            stateMap.anon_user = makePerson({
                cid : configMap.anon_id,
                id : configMap.anon_id,
                name : 'anonymous'
            });

            stateMap.user = stateMap.anon_user;

            //use the mock people collection to create a list of people
            if ( isFakeData ) {
                people_list = spa.fake.getPeopleList();
                for ( i = 0; i < people_list.length; i++ ) {
                    person_map = people_list[ i ];
                    makePerson({
                        cid : person_map._id,
                        css_map : person_map.css_map,
                        id : person_map._id,
                        name : person_map.name
                    });
                }
            }
        }

        return {
            initModule : initModule,
            people : people
        };
}());