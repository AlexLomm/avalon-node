const jwt             = require('./config/jwt');
const socketDecorator = require('./socket-decorator');
const RoomsManager    = require('./rooms-manager');

const roomsManager = new RoomsManager();

module.exports = function (io) {
  io.on('connection', socket => {
    console.log('New user connected');

    socket = socketDecorator(socket);

    let eventListenersAreInit = false;

    socket.emitWithAcknowledgement('requestAuth', {}, async (token) => {
      try {
        // TODO: refactor
        const {user} = await jwt.verify(token);

        socket.user = user;

        if (eventListenersAreInit) return;

        eventListenersAreInit = true;

        initEventListeners(socket);
      } catch (e) {
        console.log(e);

        socket.disconnect();
      }
    });

    socket.on('reconnect', () => {
      console.log('reconnect');
    });

    socket.on('disconnect', () => {
      console.log('User was disconnected');
    });
  });
};

// TODO: extract handlers
function initEventListeners(socket) {
  socket.on('updateToken', async (token) => {
    // TODO: refactor
    try {
      const {user} = await jwt.verify(token);

      socket.user = user;
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
    joinRoom(roomId, socket);
  });

  socket.on('rejoinRoom', (roomId) => {
    joinRoom(roomId, socket);
  });

  socket.on('leaveRoom', (roomId) => {
    const room = roomsManager.get(roomId);

    if (!room) return;

    room.leave(socket);
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

    message.author = socket.user.displayName;

    room.emitToAllExcept('messageReceived', message, socket.user.id);
  });
}

function joinRoom(roomId, socket) {
  const room = roomsManager.getOrCreate(roomId);

  room.join(socket);

  socket.emitWithAcknowledgement(
    'fetchNodeState',
    {state: room.getState()}
  );

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
