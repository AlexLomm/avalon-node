const Room = require('./room.js');

class RoomsManager {
  constructor() {
    this.rooms = {};

    // set up a job for periodically
    // purging inactive rooms
    setInterval(() => this.purgeInactiveRooms(), 10 * 60 * 1000);
  }

  purgeInactiveRooms(inactivityThreshold = 30 * 60 * 1000) {
    Object.keys(this.rooms).forEach(roomId => {
      const room = this.get(roomId);

      const inactivityPeriod = new Date() - room.updatedAt;

      if (inactivityPeriod > inactivityThreshold) {
        room.emitToAll('fetchNodeState', {state: room.resetState().getState()});

        this.destroyRoom(roomId);
      }
    });
  }

  getOrCreate(roomId) {
    const room = this.get(roomId);

    if (room) return room;

    this.add(roomId);

    return this.get(roomId);
  }

  get(roomId) {
    return this.rooms[roomId];
  }

  add(roomId) {
    this.rooms[roomId] = new Room(roomId);
  }

  destroyRoom(roomId) {
    this.rooms[roomId].destroy();

    delete this.rooms[roomId];
  }
}

module.exports = RoomsManager;
