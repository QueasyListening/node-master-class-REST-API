/* 
 * Request Handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Deifine handlers
let handlers = {};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};

handlers.ping = function(data, callBack){
    callBack(200);
};

// Users
handlers.users = function(data, callBack){
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callBack);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// required data: fistName, lastName, phone, password, tosAgreement
handlers._users.post = function(data, callback){
    // Check that all required fields are filled out
    const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;
    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist
        _data.read('users', phone, function(err, data){
            if (err){
                // Hash the password
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create the user object
                    const userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true,
                    }

                    // Store the user
                    _data.create('users', phone, userObject, function(err) {
                        if (!err){
                            callback(200, userObject);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not create the new user'})
                        }
                    });
                } else {
                    callback(500, {'Error':'Could not hash the password'});
                }

            } else {
                callback(400, {'Error':'A user with that phone number already exists'});
            }
        })

    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback){
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
        // Get the token from the headers
        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if (tokenIsValid){
                _data.read('users', phone, function(err, data){
                    if (!err && data) {
                        // remove the hashed password from the user object before returning it
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                })
            } else {
                callback(403, {'Error':'Missing/Invalid token in header'});
            }
        })
        // Look up the user
    } else {
        callback(400, { 'Error':'Missing required field' });
    }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function(data, callback){
    // Check for the required field
    const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.length === 10 ? data.payload.phone : false;
    const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone not specified
    if (phone) {
        // Error if at least one field isn't specified to update
        if (firstName || lastName || password ) {

            // Get the token from the headers
            const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
            // Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if (tokenIsValid){
                // Look up the user
                _data.read('users', phone, function(err, userData){
                if (!err && userData) {
                    // Update the fields
                    if (firstName)
                        userData.firstName = firstName;
                    if (lastName)
                        userData.lastName = lastName;
                    if (password)
                        userData.password = helpers.hash(password);

                    // Store new updates
                    _data.update('users', phone, userData, function(err){
                        if (!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Cound not update the user' });
                        }
                    })

                } else {
                    callback(400, { 'Error' : 'User does not exist' });
                }

            });
            } else {
                callback(403, { 'Error':'Missing/Invalid token in header'})
            }
        });

        } else {
            callback(400, { 'Error' : 'Missing field to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing Required Field'});
    }
};

// Users - delete
// Required Field: phone
// @TOTO Clean up and delete any data files associated with this user
handlers._users.delete = function(data, callback){
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
        // Get the token from the headers
        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
        if (tokenIsValid){
            // Look up the user
            _data.read('users', phone, function(err, data){
            if (!err && data) {
                _data.delete('users', phone, function(err, data){
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error':'Could not delete specified user' });
                    }
                });    
            } else {
                callback(400, { 'Error': 'Could not find the specified user' });
            }
        });
        } else {
            callback(403, {'Error':'Missing/Invalid token in header'})
        }
    });
        
    } else {
        callback(400, { 'Error':'Missing required field' });
    }
};

// Tokens
handlers.tokens = function(data, callBack){
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callBack);
    } else {
        callback(405);
    }
};

// Container for all the token methods
handlers._tokens = {};

// Tokens - post
// Required Data: phone, password
// Optional data: none

handlers._tokens.post = function(data, callback){
    const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        // Lookup the user who matches that phone number
        _data.read('users', phone, function(err, userData){
            if(!err && userData){
                const hashedPassword = helpers.hash(password);
                if (hashedPassword === userData.hashedPassword){
                    // Create a new token with a random name. Set experation one hour in the future.
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'Error': 'Could not create a new toekn' });
                        }
                    });
                } else {
                    callback(400, {'Error': 'Password invalid'});
                }
            } else {
                callback(400, {'Error':'Could not find specified user'});
            }
        })
    } else {
        callback(400, {'Error':'Missing required fields'});
    }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data, callback){
    // Check that the id number is valid
    const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.length === 20 ? data.queryStringObject.id : false;
    if (id) {
        // Look up the user
        _data.read('tokens', id, function(err, data){
            if (!err && data) {
                // remove the hashed password from the user object before returning it
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, { 'Error':'Missing required field' });
    }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback){
    const id = typeof(data.payload.id) === 'string' && data.payload.id.length === 20 ? data.payload.id : false;
    const extend = typeof(data.payload.extend) === 'string' && data.payload.extend === 'true' ? data.payload.extend : false;
    if (id && extend){
        _data.read('tokens', id, function(err, tokenData){
            if (!err && tokenData){
                // Check to make sure token isn't expired
                if (Date.now() <= tokenData.expires){
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // Store the new updates
                    _data.update('tokens', id, tokenData, function(err){
                        if (!err){
                            callback(200);
                        } else {
                            callback(500, {'Error':'Could not update the token\'s expiration'});
                        }
                    });

                } else {
                    callback(400, {'Error':'The token has already expired'});
                }
            } else {
                callback(400), {'Error':'Specified token does not exist'};
            }
        })
    } else {
        callback(400, {'Error':'Missing required field(s) or fields(s) are invalid'});
    }

};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback){
    // Check that the id is valid
    const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.length === 20 ? data.queryStringObject.id : false;
    if (id) {
        // Look up the user
        _data.read('tokens', id, function(err, data){
            if (!err && data) {
                _data.delete('tokens', id, function(err, data){
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error':'Could not delete specified token' });
                    }
                });    
            } else {
                callback(400, { 'Error': 'Could not find the specified token' });
            }
        });
    } else {
        callback(400, { 'Error':'Missing required field' });
    }
};

// Verify if given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
    // lookup the token
    _data.read('tokens', id, function(err, tokenData){
        if (!err && tokenData) {
            if (tokenData.phone === phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}


module.exports = handlers;