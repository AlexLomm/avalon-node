const Room = require('./room.js');

const RoomsManager = function (io) {
  this.io    = io;
  this.rooms = {};

  // set up a job for periodically
  // purging inactive rooms
  setInterval(() => {
    Object.keys(this.rooms).forEach(roomId => {
      const room = this.get(roomId);

      const inactivityPeriod = new Date() - room.updatedAt;

      if (inactivityPeriod > 30 * 60 * 1000) {
        room.emitToAll('fetchNodeState', {state: room.reset().getState()});

        this.destroyRoom(roomId);
      }
    });
  }, 10 * 60 * 1000);
};

RoomsManager.prototype.getOrCreate = function (roomId) {
  const room = this.get(roomId);

  if (room) return room;

  this.add(roomId);

  return this.get(roomId);
};

RoomsManager.prototype.get = function (roomId) {
  return this.rooms[roomId];
};

RoomsManager.prototype.add = function (roomId) {
  this.rooms[roomId] = new Room(roomId);
};

RoomsManager.prototype.destroyRoom = function (roomId) {
  this.rooms[roomId].destroy();

  delete this.rooms[roomId];
};

module.exports = RoomsManager;
