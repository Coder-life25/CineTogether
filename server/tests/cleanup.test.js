const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cleanupService = require('../src/services/cleanupService');
const r2Service = require('../src/services/r2Service');
const VideoMeta = require('../src/models/VideoMeta');

jest.mock('../src/services/r2Service');

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

beforeEach(async () => {
  await VideoMeta.deleteMany({});
  jest.clearAllMocks();
});

describe('CleanupService', () => {
  it('Primary cleanup finds and deletes expired active videos', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10000);
    const future = new Date(now.getTime() + 10000);

    await VideoMeta.create([
      { roomId: 'room1', objectKey: 'key1', sourceType: 'r2', status: 'active', expiresAt: past, safetyExpiresAt: future },
      { roomId: 'room2', objectKey: 'key2', sourceType: 'r2', status: 'active', expiresAt: future, safetyExpiresAt: future }
    ]);

    r2Service.deleteObject.mockResolvedValue();

    await cleanupService.runPrimaryCleanup();

    expect(r2Service.deleteObject).toHaveBeenCalledWith('key1');
    expect(r2Service.deleteObject).not.toHaveBeenCalledWith('key2');

    const v1 = await VideoMeta.findOne({ objectKey: 'key1' });
    expect(v1.status).toBe('deleted');

    const v2 = await VideoMeta.findOne({ objectKey: 'key2' });
    expect(v2.status).toBe('active');
  });

  it('Safety cleanup finds and deletes stale videos', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10000);
    const future = new Date(now.getTime() + 10000);

    await VideoMeta.create([
      { roomId: 'room1', objectKey: 'key1', sourceType: 'r2', status: 'expired', expiresAt: past, safetyExpiresAt: past }, // Missed by primary?
      { roomId: 'room2', objectKey: 'key2', sourceType: 'r2', status: 'deleted', expiresAt: past, safetyExpiresAt: past } // Already deleted
    ]);

    r2Service.deleteObject.mockResolvedValue();

    await cleanupService.runSafetyCleanup();

    expect(r2Service.deleteObject).toHaveBeenCalledWith('key1');
    expect(r2Service.deleteObject).not.toHaveBeenCalledWith('key2');

    const v1 = await VideoMeta.findOne({ objectKey: 'key1' });
    expect(v1.status).toBe('deleted');
  });
  
  it('Immediate deletion works and updates metadata', async () => {
      await VideoMeta.create({ roomId: 'room1', objectKey: 'key1', sourceType: 'r2', status: 'active' });
      r2Service.deleteObject.mockResolvedValue();

      await cleanupService.deleteVideoNow('room1', 'key1');

      expect(r2Service.deleteObject).toHaveBeenCalledWith('key1');
      const v1 = await VideoMeta.findOne({ objectKey: 'key1' });
      expect(v1.status).toBe('deleted');
  });
});
