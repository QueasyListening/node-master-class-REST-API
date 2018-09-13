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
// @TODO only let an authenticated user access their object
handlers._users.get = function(data, callback){
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
        // Look up the user
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
        callback(400, { 'Error':'Missing required field' });
    }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user update their own object
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

            })
        } else {
            callback(400, { 'Error' : 'Missing field to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing Required Field'});
    }
};

// Users - delete
// Required Field: phone
// @TODO Only let and authenticated user delete their object
// @TOTO Clean up and delete any data files associated with this user
handlers._users.delete = function(data, callback){
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
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
        callback(400, { 'Error':'Missing required field' });
    }
};

module.exports = handlers;