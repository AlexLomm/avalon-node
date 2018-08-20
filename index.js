const path     = require('path');
const http     = require('http');
const express  = require('express');
const socketIO = require('socket.io');

const port       = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '../public');

const app    = express();
const server = http.createServer(app);
const io     = socketIO(server);

app.use(express.static(publicPath));

const rooms = {};

io.on('connection', socket => {
  console.log('New user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);

    rooms[roomId]
      ? io.to(roomId).emit('fetchBothStates', roomId, rooms[roomId])
      : io.to(roomId).emit('fetchGameState', roomId);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);

    io.to(roomId).emit('fetchGameState', roomId);
  });

  socket.on('proposeTeammate', (roomId, playerId) => {
    updateNodeState(roomId, () => {
      toggleTeammate(roomId, playerId);
    });
  });

  socket.on('clearProposedTeam', (roomId) => {
    updateNodeState(roomId, () => {
      rooms[roomId].team = [];
    });
  });

  socket.on('proposeExecutionTarget', (roomId, playerId) => {
    updateNodeState(roomId, () => {
      rooms[roomId].executionTargetId = playerId;
    });
  });

  socket.on('stateChange', (roomId) => {
    delete rooms[roomId];

    io.to(roomId).emit('fetchGameState', roomId);
  });

  socket.on('disconnect', () => {
    console.log('User was disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

function updateNodeState(roomId, callback = () => {}) {
  initRoomIfMissing(roomId);

  callback();

  io.to(roomId).emit('fetchNodeState', rooms[roomId]);
}

function toggleTeammate(roomId, playerId) {
  const index = rooms[roomId].team.findIndex(id => id === playerId);

  index > -1
    ? rooms[roomId].team.splice(index, 1)
    : rooms[roomId].team.push(playerId);
}

function initRoomIfMissing(roomId) {
  if (roomNeedsCreation(roomId)) initRoom(roomId);
}

function roomNeedsCreation(roomId) {
  return !(rooms[roomId] && rooms[roomId].team);
}

function initRoom(roomId) {
  rooms[roomId] = {
    team: [],
    executionTargetId: null
  };
}
