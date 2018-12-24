class Room {
  constructor(roomId) {
    this.roomId    = roomId;
    this.updatedAt = new Date();
    this.players   = [];

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

  destroy() {
    this.players.forEach(player => this.removePlayer(player.id));
  }

  addPlayer(player, cb = () => {}) {
    this.removePlayer(player.id);

    player.joinRoom(this.roomId, cb);

    this.players.push(player);

    return this;
  }

  removePlayer(playerId, cb = () => {}) {
    const index = this.players.findIndex(p => p.id === playerId);

    if (index > -1) {
      this.players[index].leaveRoom(this.roomId, cb);

      this.players.splice(index, 1);
    }

    return this;
  }

  emitToAll(eventName, payload) {
    this.players.forEach((player) => player.emit(eventName, payload));

    return this;
  }

  emitToAllExcept(eventName, payload, playerId) {
    this.players
      .filter((player) => player.id !== playerId)
      .forEach((player) => player.emit(eventName, payload));

    return this;
  }
}

// call touch before each method call
Object.keys(Room.prototype)
  .forEach((methodName) => {
    const method               = Room.prototype[methodName];
    Room.prototype[methodName] = function (...args) {
      this.updatedAt = new Date();

      return method.apply(this, args);
    };
  });

module.exports = Room;
