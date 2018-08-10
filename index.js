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

io.on('connection', socket => {
  console.log('New user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);

    io.to(roomId).emit('fetchGameState', roomId);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);

    io.to(roomId).emit('fetchGameState', roomId);
  });

  socket.on('stateChange', (roomId) => {
    io.to(roomId).emit('fetchGameState', roomId);
  });

  socket.on('disconnect', () => {
    console.log('User was disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
