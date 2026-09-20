const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Room = require('../src/models/Room');
const roomService = require('../src/services/roomService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Room.deleteMany({});
});

describe('RoomService', () => {
  it('creates a room and returns roomId and status waiting', async () => {
    const { roomId, status } = await roomService.createRoom();
    expect(roomId).toBeDefined();
    expect(roomId.length).toBe(8);
    expect(status).toBe('waiting');

    const dbRoom = await Room.findOne({ roomId });
    expect(dbRoom).toBeDefined();
    expect(dbRoom.status).toBe('waiting');
  });

  it('joining a room adds participant', async () => {
    const { roomId } = await roomService.createRoom();
    const { participantId, room } = await roomService.joinRoom(roomId);
    
    expect(participantId).toBeDefined();
    expect(room.participants.length).toBe(1);
    expect(room.status).toBe('waiting');
  });

  it('second participant changes status to active', async () => {
    const { roomId } = await roomService.createRoom();
    await roomService.joinRoom(roomId);
    const { room } = await roomService.joinRoom(roomId);
    
    expect(room.participants.length).toBe(2);
    expect(room.status).toBe('active');
  });

  it('third participant is rejected with room full', async () => {
    const { roomId } = await roomService.createRoom();
    await roomService.joinRoom(roomId);
    await roomService.joinRoom(roomId);
    
    await expect(roomService.joinRoom(roomId)).rejects.toThrow('Room is full');
  });

  it('invalid roomId is rejected when joining', async () => {
    await expect(roomService.joinRoom('invalidID')).rejects.toThrow('Room not found');
  });

  it('room lifecycle states transition correctly', async () => {
     const { roomId } = await roomService.createRoom();
     const p1 = await roomService.joinRoom(roomId);
     const p2 = await roomService.joinRoom(roomId);

     let room = await Room.findOne({ roomId });
     expect(room.status).toBe('active');

     await roomService.leaveRoom(roomId, p1.participantId);
     room = await Room.findOne({ roomId });
     expect(room.status).toBe('waiting');

     await roomService.leaveRoom(roomId, p2.participantId);
     room = await Room.findOne({ roomId });
     expect(room.status).toBe('closing');
  });
});
