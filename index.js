const http     = require('http');
const express  = require('express');
const socketIO = require('socket.io');

const port   = process.env.PORT || 3000;
const app    = express();
const server = http.createServer(app);
const io     = socketIO(server);

require('./src/sockets')(io);

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
