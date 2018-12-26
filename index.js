const path     = require('path');
const http     = require('http');
const express  = require('express');
const socketIO = require('socket.io');

const port       = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '../public');
const app        = express();
const server     = http.createServer(app);
const io         = socketIO(server);

app.use(express.static(publicPath));

require('./src/sockets')(io);

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
