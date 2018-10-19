const path     = require('path');
const http     = require('http');
const express  = require('express');
const socketIO = require('socket.io');

const port       = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '../public');

const app    = express();
const server = http.createServer(app);
const io     = socketIO(server);

const RoomsManager = require('./rooms-manager');
const Player       = require('./player');

app.use(express.static(publicPath));

const roomsManager = new RoomsManager();

io.on('connection', socket => {
  console.log('New user connected');

  socket.on('recreateGame', (oldRoomId, newRoomId) => {
    const room = roomsManager.get(oldRoomId);

    room.emitToAll('recreateGame', {roomId: newRoomId});
  });

  socket.on('joinRoom', (roomId, playerId) => {
    const {room, player} = joinRoom(roomId, playerId, socket);

    room.emitToAllExcept('fetchBothStates', {roomId, state: room.getState()}, player.id);
  });

  socket.on('rejoinRoom', (roomId, playerId) => {
    joinRoom(roomId, playerId, socket);
  });

  socket.on('leaveRoom', (roomId, playerId) => {
    const room = roomsManager.get(roomId);

    room.removePlayer(playerId);

    room.emitToAll('fetchGameState', {roomId});
  });

  socket.on('proposeTeammate', (roomId, playerId) => {
    updateNodeState(roomId, () => {
      roomsManager.get(roomId).toggleTeammate(playerId);
    });
  });

  socket.on('clearProposedTeam', (roomId) => {
    updateNodeState(roomId, () => {
      roomsManager.get(roomId).clearTeam();
    });
  });

  socket.on('proposeExecutionTarget', (roomId, playerId) => {
    updateNodeState(roomId, () => {
      roomsManager.get(roomId).setExecutionTarget(playerId);
    });
  });

  socket.on('stateChange', (roomId) => {
    const room = roomsManager.get(roomId);

    room.resetState();

    room.emitToAll('fetchGameState', {roomId});
  });

  socket.on('disconnect', () => {
    console.log('User was disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

function joinRoom(roomId, playerId, socket) {
  const room   = roomsManager.getOrCreate(roomId);
  const player = new Player(playerId, socket);

  room.addPlayer(player);

  player.emit('fetchNodeState', {state: room.getState()});

  return {room, player};
}

function updateNodeState(roomId, callback = () => {}) {
  const room = roomsManager.getOrCreate(roomId);

  callback();

  room.emitToAll('fetchNodeState', {state: room.getState()});
}
