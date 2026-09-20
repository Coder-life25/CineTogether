const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const r2Service = require('../src/services/r2Service');

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('R2Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initiateMultipartUpload returns uploadId and objectKey', async () => {
    const mockUploadId = 'test-upload-id';
    S3Client.prototype.send.mockResolvedValueOnce({ UploadId: mockUploadId });

    const result = await r2Service.initiateMultipartUpload('room123', 'test-video.mp4', 'video/mp4');

    expect(result.uploadId).toBe(mockUploadId);
    expect(result.objectKey).toContain('rooms/room123/');
    expect(result.objectKey).toContain('test-video.mp4');
    expect(CreateMultipartUploadCommand).toHaveBeenCalledTimes(1);
  });

  it('getPresignedUploadUrl returns valid URL', async () => {
    const mockUrl = 'https://presigned-url.com';
    getSignedUrl.mockResolvedValueOnce(mockUrl);

    const result = await r2Service.getPresignedUploadUrl('test-key', 'upload-id', 1);

    expect(result).toBe(mockUrl);
    expect(UploadPartCommand).toHaveBeenCalledTimes(1);
    expect(getSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('completeMultipartUpload calls CompleteMultipartUploadCommand', async () => {
    S3Client.prototype.send.mockResolvedValueOnce({});
    
    await r2Service.completeMultipartUpload('test-key', 'upload-id', [{ ETag: '"123"', PartNumber: 1 }]);
    
    expect(CompleteMultipartUploadCommand).toHaveBeenCalledTimes(1);
  });

  it('deleteObject calls DeleteObjectCommand', async () => {
    S3Client.prototype.send.mockResolvedValueOnce({});
    
    await r2Service.deleteObject('test-key');
    
    expect(DeleteObjectCommand).toHaveBeenCalledTimes(1);
  });
});
