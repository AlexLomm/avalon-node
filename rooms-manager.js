const Room = require('./room.js');

const RoomsManager = function () {
  this.rooms = {};

  // set up a job for periodically
  // purging inactive rooms
  setInterval(() => this.purgeInactiveRooms(), 10 * 60 * 1000);
};

RoomsManager.prototype.purgeInactiveRooms = function (inactivityThreshold = 30 * 60 * 1000) {
  Object.keys(this.rooms).forEach(roomId => {
    const room = this.get(roomId);

    const inactivityPeriod = new Date() - room.updatedAt;

    if (inactivityPeriod > inactivityThreshold) {
      room.emitToAll('fetchNodeState', {state: room.resetState().getState()});

      this.destroyRoom(roomId);
    }
  });
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
