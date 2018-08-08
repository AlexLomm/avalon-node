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

  socket.emit('newEmail', {
    to: 'aaa@sss.com',
    text: 'lorem lorem',
  });

  socket.on('disconnect', () => {
    console.log('User was disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
