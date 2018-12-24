class Player {
  constructor(id, socket) {
    this.id                            = id;
    this.socket                        = socket;
    this.timesReemissionsAttempted     = 0;
    this.acknowledgementIntervalHandle = null;
  }

  joinRoom(roomId) {
    this.socket.join(roomId);
  }

  leaveRoom(roomId) {
    this.socket.leave(roomId);
  }

  emit(eventName, payload, retryInterval = 300) {
    this._resetEmissionLoop();

    this._emit(eventName, payload);

    this.acknowledgementIntervalHandle = setInterval(() => {
      this._emit(eventName, payload);

      // Give up after several attempts
      if (this.timesReemissionsAttempted > 2) this._resetEmissionLoop();
    }, retryInterval);
  }

  _resetEmissionLoop() {
    this.timesReemissionsAttempted = 0;
    clearInterval(this.acknowledgementIntervalHandle);
  }

  _emit(eventName, payload) {
    this.timesReemissionsAttempted++;
    this.socket.emit(eventName, payload, () => {
      this._resetEmissionLoop();
    });
  }
}

module.exports = Player;
