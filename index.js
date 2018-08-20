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

app.use(express.static(publicPath));

const roomsManager = new RoomsManager(io);

io.on('connection', socket => {
  console.log('New user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);

    if (roomsManager.get(roomId)) {
      socket.emit('fetchNodeState', roomsManager.get(roomId).getState());
      socket.broadcast.to(roomId).emit('fetchBothStates', roomId, roomsManager.get(roomId).getState());
    } else {
      socket.broadcast.to(roomId).emit('fetchGameState', roomId);
    }
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);

    io.to(roomId).emit('fetchGameState', roomId);
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
    roomsManager.destroy(roomId);

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
  roomsManager.createIfMissing(roomId);

  callback();

  io.to(roomId).emit('fetchNodeState', roomsManager.get(roomId).getState());
}
