// Import dotenv to add environment variables.
require('dotenv').config({ path: './config/config.env'});
// Retrieve the port from the environment variables.
PORT = process.env.PORT;

// Create an instance of the server.
const JBDServer = require('./server_scripts/JBD_Server');
const server = new JBDServer(PORT);

// Include required modules and initialize server variables.
server.init();
// Setup the site routing.
server.setRouting();
// Setup the client socket callback messages.
server.setSocketCallbacks();
// Begin to listen on the designated port.
server.listen();