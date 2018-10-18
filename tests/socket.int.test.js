const ioClient = require('socket.io-client');
const http     = require('http');
const socketIO = require('socket.io');
const Player   = require('../player');
const Room     = require('../room');

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

describe('sockets for players', () => {
  test('should emit to client', (done) => {
    io.on('connection', (socket) => {
      const player = new Player('some-id', socket);

      player.emit('testEvent', {});
    });

    spawnClient().on('testEvent', (payload, acknowledge) => {
      expect(payload).toBeDefined();
      expect(typeof acknowledge).toBe('function');

      done();
    });
  });

  test('should leave room', (done) => {
    io.on('connection', (socket) => {
      const roomId = 'some-room';
      const room   = new Room(roomId);
      const player = new Player('some-id', socket);

      room.addPlayer(player);

      setTimeout(() => {
        expect(player.socket.rooms[roomId]).toBeDefined();

        room.removePlayer(player.id);

        setTimeout(() => {
          expect(player.socket.rooms[roomId]).toBeUndefined();

          done();
        }, 0);
      }, 0);
    });

    spawnClient();
  });

  test('should re-emit to client if the previous emission was never acknowledged', (done) => {
    jest.setTimeout(500);

    io.on('connection', (socket) => {
      const player = new Player('some-id', socket);

      player.emit('testEvent', {}, 50);
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

  test('should stop re-emitting to client after the previous emission was acknowledged', (done) => {
    io.on('connection', (socket) => {
      const player = new Player('some-id', socket);

      player.emit('testEvent', {}, 50);
    });

    const onTestEventSpy = jest.fn((payload, acknowledge) => {
      acknowledge();

      setTimeout(() => {
        expect(onTestEventSpy).toBeCalledTimes(1);
        done();
      }, 150);
    });

    spawnClient().on('testEvent', onTestEventSpy);
  });
});
