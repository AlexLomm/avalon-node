const ioClient        = require('socket.io-client');
const http            = require('http');
const socketIO        = require('socket.io');
const socketDecorator = require('../src/socket-decorator');
const Room            = require('../src/room');

let httpServer;
let httpServerAddr;
let io;

beforeEach((done) => {
  httpServer     = http.createServer().listen();
  httpServerAddr = httpServer.listen().address();
  io             = socketIO(httpServer);
  done();
});

// disconnect all sockets
afterEach((done) => {
  io.close();
  httpServer.close();
  done();
});

function spawnClient() {
  // Do not hardcode server port and address,
  // square brackets are used for IPv6
  return ioClient.connect(`http://[${httpServerAddr.address}]:${httpServerAddr.port}`, {
    'reconnection delay': 0,
    'reopen delay': 0,
    'force new connection': true,
    transports: ['websocket'],
  });
}

describe('emit with acknowledgement', () => {
  test('should emit an event to the client', (done) => {
    io.on('connection', (socket) => {
      socket      = socketDecorator(socket);
      socket.user = {id: 'some-id'};

      socket.emitWithAcknowledgement('testEvent', {});
    });

    spawnClient().on('testEvent', (payload, acknowledge) => {
      expect(payload).toBeDefined();
      expect(typeof acknowledge).toBe('function');

      done();
    });
  });

  test('should leave the room', (done) => {
    io.on('connection', (socket) => {
      socket      = socketDecorator(socket);
      socket.user = {id: 'some-id'};

      const roomId = 'some-room';
      const room   = new Room(roomId);

      room.join(socket, () => {
        expect(room.sockets.includes(socket)).toBeTruthy();

        room.leave(socket, () => {
          expect(room.sockets.includes(socket)).toBeFalsy();

          done();
        });
      });
    });

    spawnClient();
  });

  // TODO: use fake timers
  test('should re-emit to the client if the previous emission was never acknowledged', (done) => {
    io.on('connection', (socket) => {
      socket      = socketDecorator(socket);
      socket.user = {id: 'some-id'};

      socket.emitWithAcknowledgement('testEvent', {}, 50);
    });

    let i = 0;

    const onTestEventSpy = jest.fn((payload, acknowledge) => {
      if (i > 0) {
        acknowledge();
        expect(onTestEventSpy).toBeCalledTimes(2);

        done();
      }

      i += 1;
    });

    spawnClient().on('testEvent', onTestEventSpy);
  });

  test('should stop re-emitting to the client after the previous emission was acknowledged', (done) => {
    jest.useFakeTimers();

    io.on('connection', (socket) => {
      socket      = socketDecorator(socket);
      socket.user = {id: 'some-id'};

      socket.emitWithAcknowledgement('testEvent', {}, 300);
    });

    let attempts         = 1;
    const onTestEventSpy = jest.fn((payload, acknowledge) => {
      if (attempts < 2) {
        attempts++;

        jest.advanceTimersByTime(300);

        return;
      }

      acknowledge();

      expect(onTestEventSpy).toBeCalledTimes(2);

      done();
    });

    spawnClient().on('testEvent', onTestEventSpy);
  });
});
