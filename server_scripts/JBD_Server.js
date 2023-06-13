class JBDServer {
  constructor(port) {
    this.port = port;
  }

  disconnectAllSockets() {
    this.io.disconnectSockets();
  }

  init() {
    // Import express for basic CRUD functionality.
    const express = require('express');
    // Create the express app.
    this.app = express();
    // Import http for port listening and sending responses.
    const http = require('http');
    // Create the server from the express app.
    this.server = http.createServer(this.app);
    // Import moment for time and date formatting.
    this.moment = require('moment');
    const { Server } = require('socket.io');
    // Create the socket interface.
    this.io = new Server(this.server);
    
    // Required for clients to locate 'css/style.css'.
    this.app.use(express.static('.'));
  };

  // Begin listening on the designated port.
  listen() {
    this.server.listen(this.port, () => {
      this.logToServer('server info', `listening on *:${this.port}`);
    });
  }

  logToServer = (messageType, message) => {
    console.log(`${messageType}: ${message}`);
  }

  /* istanbul ignore next */
  setRouting() {
    // Set the response for the root index request.
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html');
    });

    // Set the response for Google Auth request.
    this.app.get('/google', (req, res) => {
      
    });

    // Set the callback for Google Auth request.
    this.app.get('/google/callback', (req, res) => {
      
    });
  }

  setSocketCallbacks() {
    // Set the callback for a new connection.
    this.io.on('connection', (socket) => {
      // Request the username from the new connection.
      this.socketConnectionCallback(socket);

      this.setSocketChatMessageCallback(socket);
      this.setSocketDisconnectCallback(socket);
      this.setSocketNameResponseCallback(socket);
      this.setSocketNicknameChangeCallback(socket);
      this.setSocketUserTypingCallback(socket);
      this.setSocketUserTypingEndCallback(socket);
    });
  }

  /* Add timestamp and report to all sockets (including sender) the
  new messagee. */
  setSocketChatMessageCallback(socket) {
    socket.on('chat message', (message) => {
      const timestamp = this.moment().format('hh:mm');
      message = `${timestamp} | ${message}`;
      this.logToServer('message broadcast: ', message);
      this.io.emit('chat message', message);
    });
  }

  // Inform other sockets that this socket has disconnected.
  setSocketDisconnectCallback(socket) {
    socket.on('disconnect', () => {
      this.logToServer('info-connection', 'user disconnected');
      socket.broadcast.emit('chat message', 'A user has disconnected.');
    });
  }

  // Inform other sockets that this socket's user is named X and has connected.
  setSocketNameResponseCallback(socket) {
    socket.on('name response', (name) => {
      const message = `${name} has connected.`;
      this.logToServer('info-connection', message);
      socket.broadcast.emit('chat message', message);
    });
  }

  // Inform other sockets of the reporting socket's name change.
  setSocketNicknameChangeCallback(socket) {
    socket.on('nickname change', (names) => {
      socket.broadcast.emit('nickname change', (names));
    });
  }

  // Inform other sockets this socket is currently typing.
  setSocketUserTypingCallback(socket) {
    socket.on('user typing', (user_name) => {
      socket.broadcast.emit('user typing', user_name);
    });
  }

  // Inform other sockets this socket has finished typing.
  setSocketUserTypingEndCallback(socket) {
    socket.on('user typing end', (user_name) => {
      socket.broadcast.emit('user typing end', user_name);
    });
  }

  shutdown() {
    this.io.close();
  }

  socketConnectionCallback(socket) {
    this.logToServer('info-connection', 'user is requesting connection');

    // Request the name of the new connection's user.
    socket.emit('name request');
  }
}

module.exports = JBDServer;