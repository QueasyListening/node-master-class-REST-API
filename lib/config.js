// Create and export configuration variables

//Container for all the enviroments
const enviroments = {};

// Staging (default) enviroment
enviroments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
};

// Production enviroment
enviroments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsASecret',
};

// Determine which enviroment was passed as a command-line argument
var currentEnviroment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current envirment is valid
var enviromentToExport = typeof(enviroments[currentEnviroment]) === 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;