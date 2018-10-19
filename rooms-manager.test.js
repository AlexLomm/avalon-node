const RoomsManager = require('./rooms-manager');
const Room         = require('./room');

Room.prototype.emitToAll = jest.fn();

describe('rooms manager', () => {
  test('should add and get a room', () => {
    const manager = new RoomsManager();

    manager.add('id-1');
    const room = manager.get('id-1');

    expect(room instanceof Room).toStrictEqual(true);
  });

  test('should create a room if it doesn\'t already exist', () => {
    const manager = new RoomsManager();

    const room = manager.getOrCreate('id-1');

    expect(room instanceof Room).toStrictEqual(true);
  });

  test('should return a room with the specified id if it exists', () => {
    const manager = new RoomsManager();

    manager.add('id-1');

    expect(manager.get('id-1')).toBeDefined();
    expect(manager.get('nonexistent-id')).toBeUndefined();
  });

  test('should return a room with the specified id or create one', () => {
    const manager = new RoomsManager();

    manager.add('id-1');

    expect(manager.get('id-1')).toEqual(manager.getOrCreate('id-1'));
    expect(manager.getOrCreate('nonexistent-id')).toBeDefined();
  });

  test('should destroy the room', () => {
    const manager = new RoomsManager();

    const room = manager.getOrCreate('id-1');

    jest.spyOn(room, 'destroy');

    manager.destroyRoom('id-1');

    expect(manager.get('id-1')).toBeUndefined();
    expect(room.destroy).toBeCalled();
  });

  test('should check on every room', () => {
    const manager = new RoomsManager();
    jest.spyOn(manager, 'get');

    manager.add('id-1');
    manager.add('id-2');

    manager.purgeInactiveRooms();

    expect(manager.get).toBeCalledTimes(2);
  });

  test('should purge only inactive rooms', (done) => {
    const manager = new RoomsManager();

    manager.add('id-1');
    const room = manager.get('id-1');

    jest.spyOn(room, 'resetState');
    jest.spyOn(room, 'getState');
    jest.spyOn(room, 'emitToAll');

    setTimeout(() => {
      manager.add('id-2');

      manager.purgeInactiveRooms(50);

      expect(room.resetState).toBeCalled();
      expect(room.getState).toBeCalled();
      expect(room.emitToAll).toBeCalled();
      expect(manager.get('id-1')).toBeUndefined();
      expect(manager.get('id-2')).toBeDefined();

      done();
    }, 100);
  });
});
