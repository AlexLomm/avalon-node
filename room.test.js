const Room = require('./room');

test('should reset room to it\'s original state', () => {
  const room = new Room();

  room.team              = ['something'];
  room.executionTargetId = 'something';

  room.resetState();

  expect(room.team).toStrictEqual([]);
  expect(room.executionTargetId).toBeFalsy();
});

test('should not touch `roomId`, `players` and `updatedAt`', () => {
  const room   = new Room('room-id');
  room.players = ['something'];

  const roomId    = room.roomId;
  const updatedAt = room.updatedAt;
  const players   = room.players;

  room.resetState();

  expect(roomId).toStrictEqual(room.roomId);
  expect(updatedAt).toStrictEqual(room.updatedAt);
  expect(players).toStrictEqual(['something']);
});

test('should toggle teammate', () => {
  const room = new Room('room-id');

  room.toggleTeammate('some-id-1');
  room.toggleTeammate('some-id-2');
  expect(room.team).toStrictEqual(['some-id-1', 'some-id-2']);

  room.toggleTeammate('some-id-1');
  expect(room.team).toStrictEqual(['some-id-2']);

  room.toggleTeammate('some-id-2');
  expect(room.team).toStrictEqual([]);
});

test('should reset team', () => {
  const room = new Room();

  room.team = ['something'];

  room.clearTeam();

  expect(room.team).toEqual([]);
});

test('should set execution target', () => {
  const room = new Room();

  room.setExecutionTarget('execution-id-1');

  expect(room.executionTargetId).toEqual('execution-id-1');
});
