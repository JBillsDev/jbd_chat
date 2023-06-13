const JBDServer = require('../server_scripts/JBD_Server');
const ClientSocket = require('socket.io-client');

describe('Test JBD_Server functionality.', () => {
  const PORT = 3000;
  let server = undefined;
  let client_socket = undefined;

  function createSocket() {
    return new ClientSocket(`http://localhost:${PORT}`);
  }

  beforeAll(() => {
    // Setup the server for testing.
    server = new JBDServer(PORT);
    server.init();
    server.setRouting();
    server.setSocketCallbacks();
    server.listen();

    // Setup mocking for console logging.
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    client_socket = createSocket();
  })

  afterEach(() => {
    // Clear console mocking.
    console.log.mockClear();

    server.disconnectAllSockets();
  })
  
  afterAll(() => {
    server.shutdown();

    // Restore the mocks after all testing is finished.
    console.log.mockRestore();
  });

  test('Client shutdown ends port listening.', (done) => {
    server.shutdown();

    setTimeout(() => {
      const client_socket_second = createSocket();
      setTimeout(() => {
        done();
        server.listen(PORT);
      }, 2000);
    }, 500);
  });

  // Client socket callback tests.

  describe('Client socket callbacks.', () => {
    test('Client socket connection results in name request.', (done) => {
      client_socket.on('name request', (arg) => {
        expect(arg).toBe(undefined);
        done();
      });
    });

    test('Client is notified of chat messages.', (done) => {
      client_socket.emit('chat message', 'message');
      client_socket.on('chat message', (message) => {
        expect(message).toBeTruthy();
        done();
      });
    });

    test('Client is notified of separate client disconnecting.', (done) => {
      const client_socket_second = createSocket();
      client_socket.on('chat message', (message) => {
        expect(message.includes('disconnected')).toBeTruthy();
        done();
      });

      setTimeout(() => {
        client_socket_second.disconnect();
      }, 500);
    });

    test('Client is notified of separate client connecting.', (done) => {
      let client_socket_second;
      client_socket.on('chat message', (message) => {
        expect(message.includes('connected')).toBeTruthy();
        done();
      });

      setTimeout(() => {
        client_socket_second = createSocket();
        client_socket_second.emit('name response', 'user');
      }, 500);
    });

    test('Client is notified of sperate client name change.', (done) => {
      const client_socket_second = createSocket();
      client_socket.on('nickname change', (arg) => {
        const names = JSON.parse(arg);
        expect(names.to).toBe('new_name');

        done();
      });
      
      setTimeout(() => {
        const names = {
          from: 'old_name',
          to: 'new_name'
        };

        client_socket_second.emit('nickname change', JSON.stringify(names));
      }, 500);
    });

    test('Client receives notification that a separate client is typing', (done) => {
      const client_socket_second = createSocket();
      client_socket.on('user typing', (name) => {
        expect(name).toBe('User');
        done();
      });

      setTimeout(() => {
        client_socket_second.emit('user typing', 'User');
      }, 500);
    });

    test('Client receives notification that a separate client is finished typing', (done) => {
      const client_socket_second = createSocket();
      client_socket.on('user typing end', (name) => {
        expect(name).toBe('User');
        done();
      });

      setTimeout(() => {
        client_socket_second.emit('user typing end', 'User');
      }, 500);
    });
  });
});