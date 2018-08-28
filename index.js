/*
* Primary file for the API
*
*/

//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

const _data = require('./lib/data');

// The server should respond to all requests with a string

// Instantiating the HTTP server 
const httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);
});

// Start the server
httpServer.listen(config.httpPort, function(){
    console.log(`The http server is listening on port ${config.httpPort}`);
});

// Set HTTPS server options
const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'), 
    'cert' : fs.readFileSync('./https/cert.pem')
};

// Instantiate HTTPS server
const httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res);
});


// Start HTTPS server
httpsServer.listen(config.httpsPort, function(){
    console.log(`The server https server is listening on port ${config.httpsPort}`);
});

// All the server logic for both the hhtp and https server
const unifiedServer = function(req, res) {
    // Get url and parse it
    let parsedUrl = url.parse(req.url, true);

    // Get the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query sting as an objcet
    let queryStringObject = parsedUrl.query;
    // Get the HTTP method
    let method = req.method.toLowerCase();

    // Get the headers as an object
    let headers = req.headers;

    // Get the payload, if any
    let decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    req.on('end', function(){
        buffer += decoder.end();

        // choose the handler this req should go to 
        // Use notFound if not found
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound; 

        // Construct the data object to send to the handler
        let data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode,payload){
            // Use the status code calledback by the handler or default to 200
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

            // Use the payload calledback by the handler or default to and empty object
            payload = typeof(payload) === 'object' ? payload : {};

            // convert the payload to a string
            let payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            
            // Send the response
            res.end(payloadString);

            // Log the request path
            console.log('Returning this response: ', payloadString);
            
        });

    
    });
}

// Deifine handlers
let handlers = {};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};

handlers.ping = function(data, callBack){
    callBack(200);
};

// Define a request router
let router = {
    'notFound' : handlers.notFound,
    'ping' : handlers.ping
}