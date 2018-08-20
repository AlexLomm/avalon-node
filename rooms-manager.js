const Room = require('./room.js');

const RoomsManager = function (io) {
  this.io    = io;
  this.rooms = {};

  // set up a job for periodically
  // purging inactive rooms
  setInterval(() => {
    Object.keys(this.rooms).forEach(roomId => {
      const inactivityPeriod = new Date() - this.get(roomId).updatedAt;

      if (inactivityPeriod > 30 * 60 * 1000) {
        this.io.to(roomId).emit('fetchNodeState', this.get(roomId).reset().getState());

        this.destroy(roomId);
      }
    });
  }, 10 * 60 * 1000);
};

RoomsManager.prototype.createIfMissing = function (roomId) {
  if (this.get(roomId)) return;

  this.rooms[roomId] = new Room(roomId);
};

RoomsManager.prototype.get = function (roomId) {
  return this.rooms[roomId];
};

RoomsManager.prototype.destroy = function (roomId) {
  delete this.rooms[roomId];
};

module.exports = RoomsManager;
