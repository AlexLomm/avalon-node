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
      await authenticate(socket, token);

      if (eventListenersAreInit) return;

      eventListenersAreInit = true;

      initEventListeners(socket);
    });

    socket.on('disconnect', () => {
      console.log('User was disconnected');
    });
  });
};

// TODO: extract handlers
function initEventListeners(socket) {
  socket.on('updateToken', (token) => {
    authenticate(socket, token);
  });

  socket.on('recreateGame', (oldRoomId, newRoomId) => {
    const room = roomsManager.get(oldRoomId);

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

    room.leave(socket);
  });

  socket.on('proposeTeammate', (roomId, playerId) => {
    updateNodeState({
      roomId,
      senderId: socket.user.id,
    }, () => {
      roomsManager.get(roomId).toggleTeammate(playerId);
    });
  });

  socket.on('clearProposedTeam', (roomId) => {
    updateNodeState({
      roomId,
      senderId: socket.user.id,
    }, () => {
      roomsManager.get(roomId).clearTeam();
    });
  });

  socket.on('proposeExecutionTarget', (roomId, playerId) => {
    updateNodeState({
      roomId,
      senderId: socket.user.id,
    }, () => {
      roomsManager.get(roomId).setExecutionTarget(playerId);
    });
  });

  socket.on('stateChange', (roomId) => {
    const room = roomsManager.get(roomId);

    room.resetState();

    room.emitToAll('fetchGameState', {roomId});
  });
}

async function authenticate(socket, token) {
  try {
    const {user} = await jwt.verify(token);

    socket.user = user;
  } catch (e) {
    console.log(e);

    socket.disconnect();
  }
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
