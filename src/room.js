'use strict';

class Room {
  constructor(roomId) {
    this.roomId    = roomId;
    this.updatedAt = Date.now();
    this.sockets   = [];

    this.resetState();
  }

  resetState() {
    this.team              = [];
    this.executionTargetId = null;

    this._lockState();

    return this;
  }

  _lockState() {
    this.stateIsLocked = true;
  }

  _unlockState() {
    this.stateIsLocked = false;
  }

  toggleTeammate(playerId) {
    this._unlockState();

    const index = this.team.findIndex(id => id === playerId);

    index > -1
      ? this.team.splice(index, 1)
      : this.team.push(playerId);

    return this;
  }

  clearTeam() {
    this._unlockState();

    this.team = [];

    return this;
  }

  setExecutionTarget(playerId) {
    this._unlockState();

    this.executionTargetId = playerId;

    return this;
  }

  getState() {
    return {
      stateIsLocked: this.stateIsLocked,
      team: this.team,
      executionTargetId: this.executionTargetId
    };
  }

  getUsers() {
    return this.sockets.map(socket => socket.user);
  }

  destroy() {
    this.sockets.forEach((socket) => this.leave(socket));
  }

  join(socket, cb = () => {}) {
    this.leave(socket);

    socket.join(this.roomId, cb);

    this.sockets.push(socket);

    return this;
  }

  leave(socket, cb = () => {}) {
    const index = this.sockets.findIndex((s) => s.user.id === socket.user.id);

    if (index > -1) {
      this.sockets[index].leave(this.roomId, cb);

      this.sockets.splice(index, 1);
    }

    return this;
  }

  emitToAll(eventName, payload) {
    this.sockets.forEach(
      (socket) => socket.emitWithAcknowledgement(eventName, payload)
    );

    return this;
  }

  emitToAllExcept(eventName, payload, userId) {
    this.sockets
      .filter((socket) => socket.user.id !== userId)
      .forEach((socket) => socket.emitWithAcknowledgement(eventName, payload));

    return this;
  }

  includes(socket) {
    return this.sockets.find(s => s === socket);
  }
}

// call touch before each method call
Object.keys(Room.prototype)
  .forEach((methodName) => {
    const method = Room.prototype[methodName];

    Room.prototype[methodName] = function (...args) {
      this.updatedAt = Date.now();

      return method.apply(this, args);
    };
  });

module.exports = Room;
