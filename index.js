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
    initRoomIfMissing(roomId);

    toggleTeammate(roomId, playerId);

    io.to(roomId).emit('fetchNodeState', rooms[roomId]);
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
    team: []
  };
}
