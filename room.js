const Room = function (roomId) {
  this.roomId    = roomId;
  this.updatedAt = new Date();
  this.players   = [];

  this.resetState();
};

Room.prototype.resetState = function () {
  this.team              = [];
  this.executionTargetId = null;

  return this;
};

Room.prototype.toggleTeammate = function (playerId) {
  const index = this.team.findIndex(id => id === playerId);

  index > -1
    ? this.team.splice(index, 1)
    : this.team.push(playerId);

  return this;
};

Room.prototype.clearTeam = function () {
  this.team = [];

  return this;
};

Room.prototype.setExecutionTarget = function (playerId) {
  this.executionTargetId = playerId;

  return this;
};

Room.prototype.getState = function () {
  return {
    team: this.team,
    executionTargetId: this.executionTargetId
  };
};

Room.prototype.destroy = function () {
  this.players.forEach(player => this.removePlayer(player.id));
};

Room.prototype.addPlayer = function (player) {
  this.removePlayer(player.id);

  this.players.push(player);

  return this;
};

Room.prototype.removePlayer = function (playerId) {
  const index = this.players.findIndex(p => p.id === playerId);

  if (index > -1) {
    this.players[index].leaveRoom(this.roomId);

    this.players.splice(index, 1);
  }

  return this;
};

Room.prototype.emitToAll = function (eventName, payload) {
  this.players.forEach((player) => player.emit(eventName, payload));

  return this;
};

Room.prototype.emitToAllExcept = function (eventName, payload, playerId) {
  this.players
      .filter((player) => player.id !== playerId)
      .forEach((player) => player.emit(eventName, payload));

  return this;
};

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
