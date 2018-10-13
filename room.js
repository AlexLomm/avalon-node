const Room = function (roomId) {
  this.roomId    = roomId;
  this.updatedAt = new Date();

  this.reset();
};

Room.prototype.reset = function () {
  this.team              = [];
  this.executionTargetId = null;

  this.touch();

  return this;
};

Room.prototype.toggleTeammate = function (playerId) {
  const index = this.team.findIndex(id => id === playerId);

  index > -1
    ? this.team.splice(index, 1)
    : this.team.push(playerId);

  this.touch();

  return this;
};

Room.prototype.clearTeam = function () {
  this.team = [];
  this.touch();

  return this;
};

Room.prototype.setExecutionTarget = function (playerId) {
  this.executionTargetId = playerId;
  this.touch();

  return this;
};

// TODO: it's easy to miss adding a call to touch() in a new method
Room.prototype.touch = function () {
  this.updatedAt = new Date();

  return this;
};

Room.prototype.getState = function () {
  return {
    team: this.team,
    executionTargetId: this.executionTargetId
  };
};

module.exports = Room;
