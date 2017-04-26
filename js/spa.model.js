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
            user : null,
            is_connected : false, // indicates if the user is currently in the chat room
        },

        isFakeData = true,

        people, initModule, chat, makePerson, makeCid, clearPeopleDb, completeLogin, removePerson,
        personProto;

        //Helpers

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

            chat.join();

            // When we add chat, we should join here
            $.gevent.publish( 'spa-login', [ stateMap.user ] );
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

        //end helpers

        //chat API
        chat = (function () {
        
            var
            _publish_listchange, _publish_updatechat, is_chatee_online, update_avatar,
            _update_list, _leave_chat, join_chat, get_chatee, send_msg, set_chatee,
            
            chatee = null;

             // Begin internal methods

             //refresh people object when a new people list is received
            _update_list = function( arg_list ) {
                var i, person_map, make_person_map, person,
                    people_list = arg_list[ 0 ];
                    is_chatee_online = false;

                clearPeopleDb();

                PERSON:
                for ( i = 0; i < people_list.length; i++ ) {
                    person_map = people_list[ i ];
                    if ( ! person_map.name ) { continue PERSON; }

                    // if user defined, update css_map and skip remainder
                    if ( stateMap.user && stateMap.user.id === person_map._id ) {
                        stateMap.user.css_map = person_map.css_map;
                        continue PERSON;
                    }

                    //otherwise make new user and add him to user list
                    make_person_map = {
                        cid : person_map._id,
                        css_map : person_map.css_map,
                        id : person_map._id,
                        name : person_map.name
                    };
                    person = makePerson( make_person_map );

                    if ( chatee && chatee.id === make_person_map.id ) {
                        is_chatee_online = true;
                        chatee = person;
                    }
                }
                stateMap.people_db.sort( 'name' );
            };

            // If chatee is no longer online, we unset the chatee
            // which triggers the 'spa-setchatee' global event
            if ( chatee && ! is_chatee_online ) { set_chatee(''); }

            //update list and publish that the list was changed
            _publish_listchange = function ( arg_list ) {
                _update_list( arg_list );
                $.gevent.publish( 'spa-listchange', [ arg_list ] );
            };

            //publish event with a map of message details 
            _publish_updatechat = function ( arg_list ) {
                var msg_map = arg_list[ 0 ];
                if ( ! chatee ) { 
                    set_chatee( msg_map.sender_id ); 
                }
                else if ( msg_map.sender_id !== stateMap.user.id && msg_map.sender_id !== chatee.id) { 
                    set_chatee( msg_map.sender_id ); 
                }
                $.gevent.publish( 'spa-updatechat', [ msg_map ] );
            };

            // End internal methods

            //leave chat and update backend 
            _leave_chat = function () {
                var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
                stateMap.is_connected = false;
                chatee = null;
                if ( sio ) { sio.emit( 'leavechat' ); }
            };

            get_chatee = function () { return chatee; };

            //join a logged in user to chat. update backend
            join_chat = function () {
                var sio;
                if ( stateMap.is_connected ) { return false; }

                if ( stateMap.user.get_is_anon() ) {
                    console.warn( 'User must be defined before joining chat');
                    return false;
                }

                sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
                sio.on( 'listchange', _publish_listchange );
                sio.on( 'updatechat', _publish_updatechat );
                stateMap.is_connected = true;

                return true;
            };

            //send message and update the window with an updatechat event
            send_msg = function ( msg_text ) {
            var msg_map,
                sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

                //abort message if user is no longer online or if no chatee is set
                if ( ! sio ) { return false; }
                if ( ! ( stateMap.user && chatee ) ) { return false; }

                msg_map = {
                    dest_id : chatee.id,
                    dest_name : chatee.name,
                    sender_id : stateMap.user.id,
                    msg_text : msg_text
                };

                // we published updatechat so we can show our outgoing messages
                _publish_updatechat( [ msg_map ] );
                sio.emit( 'updatechat', msg_map );

                return true;
            };

            //change the chatee only if changed
            set_chatee = function ( person_id ) {
                var new_chatee;
                new_chatee = stateMap.people_cid_map[ person_id ];
                if ( new_chatee ) {
                    if ( chatee && chatee.id === new_chatee.id ) {
                        return false;
                    }
                }
                else {
                    new_chatee = null;
                }

                //publish chatee changed event
                $.gevent.publish( 'spa-setchatee', { old_chatee : chatee, new_chatee : new_chatee });
                chatee = new_chatee;
                return true;
            };

            /** update_avatar( <update_avtr_map> ) - send the
             update_avtr_map to the backend. This results in an
             an 'spa-listchange' event which publishes the updated
             people list and avatar information (the css_map in the
             person objects). The update_avtr_map must
             have the form { person_id : person_id, css_map : css_map }*/
            update_avatar = function ( avatar_update_map ) {
                var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
                if ( sio ) {
                    sio.emit( 'updateavatar', avatar_update_map );
                }
            };


            return {
                _leave : _leave_chat,
                join : join_chat,
                get_chatee : get_chatee,
                send_msg : send_msg,
                set_chatee : set_chatee,
                update_avatar : update_avatar
            };

        })();

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
                var user = stateMap.user;
                
                // when we add chat, we should leave the chatroom here
                chat._leave();

                stateMap.user = stateMap.anon_user;
                clearPeopleDb();

                $.gevent.publish( 'spa-logout', [ user ] );
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
            // if ( isFakeData ) {
            //     people_list = spa.fake.getPeopleList();
            //     for ( i = 0; i < people_list.length; i++ ) {
            //         person_map = people_list[ i ];
            //         makePerson({
            //             cid : person_map._id,
            //             css_map : person_map.css_map,
            //             id : person_map._id,
            //             name : person_map.name
            //         });
            //     }
            // }
        }

        return {
            initModule : initModule,
            people : people,
            chat :chat
        };
}());