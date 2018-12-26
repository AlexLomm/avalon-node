const Room = require('../src/room');

function generateFakeSocket(id = 'some-id') {
  return {
    user: {id},
    emitWithAcknowledgement: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
  };
}

test('should reset the room to it\'s original state', () => {
  const room = new Room();

  room.toggleTeammate('some-id-1');
  room.setExecutionTarget('some-id-2');

  room.resetState();

  expect(room.getState().team).toStrictEqual([]);
  expect(room.getState().executionTargetId).toBeFalsy();
  expect(room.getState().stateIsLocked).toStrictEqual(true);
});

test('should not reset `roomId`, `sockets` and `updatedAt`', () => {
  const room   = new Room('room-id');
  room.sockets = ['something'];

  const roomId    = room.roomId;
  const updatedAt = room.updatedAt;
  const sockets   = room.sockets;

  room.resetState();

  expect(roomId).toStrictEqual(room.roomId);
  expect(updatedAt).toStrictEqual(room.updatedAt);
  expect(sockets).toStrictEqual(['something']);
});

test('should toggle a teammate', () => {
  const room = new Room('room-id');

  room.toggleTeammate('some-id-1');
  room.toggleTeammate('some-id-2');
  expect(room.getState().team).toStrictEqual(['some-id-1', 'some-id-2']);

  room.toggleTeammate('some-id-1');
  expect(room.getState().team).toStrictEqual(['some-id-2']);

  room.toggleTeammate('some-id-2');
  expect(room.getState().team).toStrictEqual([]);
});

test('should reset the team', () => {
  const room = new Room();

  room.toggleTeammate('some-id');

  room.clearTeam();

  expect(room.getState().team).toEqual([]);
});

test('should set an execution target', () => {
  const room = new Room();

  room.setExecutionTarget('execution-id-1');

  expect(room.getState().executionTargetId).toEqual('execution-id-1');
});

test('should get the state', () => {
  const room = new Room();

  expect(room.getState().team).toBeDefined();
  expect(room.getState().executionTargetId).toBeDefined();
});

test('should remove the sockets from the room', () => {
  const room = new Room();

  room.join(generateFakeSocket());

  room.destroy();

  expect(room.sockets).toEqual([]);
});

test('should add a socket to the room', () => {
  const room   = new Room();
  const socket = generateFakeSocket();

  room.join(socket);

  expect(room.sockets).toEqual([socket]);
});

test('should replace a socket with the similar id in the room', () => {
  const room    = new Room();
  const socket1 = generateFakeSocket('some-id');
  const socket2 = generateFakeSocket('some-id');

  room.join(socket1);
  room.join(socket2);

  expect(room.sockets).toEqual([socket2]);
});

test('should remove all sockets from the room', () => {
  const room = new Room();

  room.join(generateFakeSocket());

  room.destroy();

  expect(room.sockets).toEqual([]);
});

test('should lock the room state', () => {
  const room = new Room();

  room.resetState();

  expect(room.getState().stateIsLocked).toStrictEqual(true);
});

test('should unlock the room state', () => {
  const room = new Room();

  room.toggleTeammate('some-id');
  expect(room.getState().stateIsLocked).toStrictEqual(false);
  room.resetState();

  room.clearTeam();
  expect(room.getState().stateIsLocked).toStrictEqual(false);
  room.resetState();

  room.setExecutionTarget('some-id');
  expect(room.getState().stateIsLocked).toStrictEqual(false);
  room.resetState();
});

test('should emit to all sockets', () => {
  const room = new Room();

  const sockets = [
    generateFakeSocket('some-id-1'),
    generateFakeSocket('some-id-2')
  ];

  sockets.forEach(socket => room.join(socket));

  room.emitToAll('test', {});

  expect(room.sockets[0].emitWithAcknowledgement).toBeCalled();
  expect(room.sockets[1].emitWithAcknowledgement).toBeCalled();
});

test('should emit to all sockets except the one specified', () => {
  const room = new Room();

  const sockets = [
    generateFakeSocket('some-id-1'),
    generateFakeSocket('some-id-2')
  ];

  sockets.forEach(socket => room.join(socket));

  room.emitToAllExcept('test', {}, 'some-id-2');

  expect(room.sockets[0].emitWithAcknowledgement).toBeCalled();
  expect(room.sockets[1].emitWithAcknowledgement).toBeCalledTimes(0);
});
