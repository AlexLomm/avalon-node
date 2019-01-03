const {imageUrl}      = require('gravatar-api');
const jwt             = require('./config/jwt');
const socketDecorator = require('./socket-decorator');
const RoomsManager    = require('./rooms-manager');

const roomsManager = new RoomsManager();

module.exports = function (io) {
  io.on('connection', socket => {
    console.log('New user connected');

    socket = socketDecorator(socket);

    let eventListenersAreInit = false;

    socket.emitWithAcknowledgement('requestAuth', {}, async (token, roomId) => {
      try {
        const user = await extractUserFromToken(token);

        disconnectExistingUser(io, socket, user.id);

        socket.user = user;

        if (eventListenersAreInit) return;

        eventListenersAreInit = true;

        initEventListeners(socket);

        // reconnect to the room
        if (!roomId) return;

        joinRoom(socket, roomId);
      } catch (e) {
        console.log(e);

        socket.disconnect();
      }
    });

    socket.on('reconnect', () => {
      console.log('reconnect');
    });

    socket.on('disconnect', () => {
      roomsManager.getSocketRooms(socket)
        .forEach((r) => {
          r.leave(socket);

          r.emitToAll('fetchRoomUsers', {
            roomUsers: r.getUsers()
          });
        });

      console.log('User was disconnected');
    });
  });
};

function disconnectExistingUser(io, socket, userId) {
  const existingSocket = Object.values(io.sockets.sockets)
    .find((socket) => {
      if (!socket.user) return false;

      return socket.user.id === userId;
    });

  if (existingSocket && existingSocket !== socket) {
    existingSocket.emitWithAcknowledgement('logOut');
  }
}

// TODO: extract handlers
function initEventListeners(socket) {
  socket.on('updateToken', async (token) => {
    // TODO: refactor
    try {
      socket.user = await extractUserFromToken(token);
    } catch (e) {
      console.log(e);

      socket.disconnect();
    }
  });

  socket.on('recreateGame', (oldRoomId, newRoomId) => {
    const room = roomsManager.get(oldRoomId);

    if (!room) return;

    room.emitToAll('recreateGame', {roomId: newRoomId});
  });

  socket.on('joinRoom', (roomId) => {
    joinRoom(socket, roomId);
  });

  socket.on('leaveRoom', (roomId) => {
    const room = roomsManager.get(roomId);

    if (!room) return;

    room.leave(socket);

    room.emitToAll(
      'fetchRoomUsers',
      {roomUsers: room.getUsers()}
    );
  });

  socket.on('proposeTeammate', (roomId, playerId) => {
    updateNodeState({
      roomId,
      senderId: socket.user.id,
    }, () => {
      const room = roomsManager.get(roomId);

      if (!room) return;

      room.toggleTeammate(playerId);
    });
  });

  socket.on('clearProposedTeam', (roomId) => {
    updateNodeState({
      roomId,
      senderId: socket.user.id,
    }, () => {
      const room = roomsManager.get(roomId);

      if (!room) return;

      room.clearTeam();
    });
  });

  socket.on('proposeExecutionTarget', (roomId, playerId) => {
    updateNodeState({
      roomId,
      senderId: socket.user.id,
    }, () => {
      const room = roomsManager.get(roomId);

      if (!room) return;

      room.setExecutionTarget(playerId);
    });
  });

  socket.on('stateChange', (roomId) => {
    const room = roomsManager.get(roomId);

    if (!room) return;

    room.resetState();

    room.emitToAll('fetchGameState', {roomId});
  });

  socket.on('sendMessage', (roomId, message) => {
    const room = roomsManager.get(roomId);

    if (!room) return;

    // TODO: persist messages
    // TODO: fetch old messages for new users

    message.author = socket.user.id;

    room.emitToAllExcept('messageReceived', message, socket.user.id);
  });
}

async function extractUserFromToken(token) {
  const {user} = await jwt.verify(token);

  user.gravatarUrl = imageUrl({
    email: user.email,
    parameters: {default: 'monsterid'}
  });

  delete user['email'];

  return user;
}

function joinRoom(socket, roomId) {
  const room = roomsManager.getOrCreate(roomId);

  room.join(socket);

  socket.emitWithAcknowledgement('fetchNodeState', {
    state: room.getState(),
    senderId: socket.user.id,
  });

  room.emitToAll('fetchRoomUsers', {
    roomUsers: room.getUsers()
  });

  return room;
}

function updateNodeState({roomId, senderId}, callback = () => {}) {
  const room = roomsManager.getOrCreate(roomId);

  callback();

  room.emitToAll('fetchNodeState', {
    state: room.getState(),
    senderId
  });
}
