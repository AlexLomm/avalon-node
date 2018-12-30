'use strict';

module.exports = (socket) => {
  let emissionsCounter = 0;
  let acknowledgementIntervalHandle;

  const _createAcknowledgement = (cb) => {
    return (...args) => {
      cb(...args);

      _resetEmissionLoop();
    };
  };

  const _resetEmissionLoop = () => {
    emissionsCounter = 0;

    clearInterval(acknowledgementIntervalHandle);
  };

  const _emit = (eventName, payload, acknowledgement) => {
    emissionsCounter++;

    socket.emit(eventName, payload, acknowledgement);
  };

  socket.emitWithAcknowledgement = (
    eventName,
    payload,
    callback      = () => {},
    // TODO: handle over-the-interval ms lag
    retryInterval = 1000
  ) => {
    _resetEmissionLoop();

    const acknowledgement = _createAcknowledgement(callback);

    _emit(eventName, payload, acknowledgement);

    acknowledgementIntervalHandle = setInterval(() => {
      _emit(eventName, payload, acknowledgement);

      // Give up after several attempts
      if (emissionsCounter > 2) _resetEmissionLoop();
    }, retryInterval);
  };

  return socket;
};
