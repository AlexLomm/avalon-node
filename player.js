const Player = function (id, socket) {
  this.id                            = id;
  this.socket                        = socket;
  this.timesReemissionsAttempted     = 0;
  this.acknowledgementIntervalHandle = null;
};

Player.prototype.joinRoom = function (roomId) {
  this.socket.join(roomId);
};

Player.prototype.leaveRoom = function (roomId) {
  if (this.socket.connected) {
    this.socket.leave(roomId);
  }
};

Player.prototype.emit = function (eventName, payload, retryInterval = 300) {
  this._resetEmissionLoop();

  this._emit(eventName, payload);

  this.acknowledgementIntervalHandle = setInterval(() => {
    this._emit(eventName, payload);

    // Give up after several attempts
    if (this.timesReemissionsAttempted > 2) this._resetEmissionLoop();
  }, retryInterval);
};

Player.prototype._resetEmissionLoop = function () {
  this.timesReemissionsAttempted = 0;
  clearInterval(this.acknowledgementIntervalHandle);
};

Player.prototype._emit = function (eventName, payload) {
  this.timesReemissionsAttempted++;
  this.socket.emit(eventName, payload, () => {
    this._resetEmissionLoop();
  });
};

module.exports = Player;
