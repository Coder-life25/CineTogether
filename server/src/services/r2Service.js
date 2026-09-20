const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const logger = require('../utils/logger');

class R2Service {
  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
    this.bucketName = env.r2.bucketName;
  }

  async initiateMultipartUpload(roomId, filename, contentType) {
    try {
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const objectKey = `rooms/${roomId}/${uuidv4()}-${sanitizedFilename}`;
      
      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        ContentType: contentType
      });

      const response = await this.client.send(command);
      logger.info(`Initiated multipart upload for ${objectKey}. UploadId: ${response.UploadId}`);
      
      return {
        uploadId: response.UploadId,
        objectKey: objectKey
      };
    } catch (error) {
      logger.error('Error initiating multipart upload:', error);
      throw error;
    }
  }

  async getPresignedUploadUrl(objectKey, uploadId, partNumber) {
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const presignedUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
      return presignedUrl;
    } catch (error) {
      logger.error(`Error generating presigned upload url for part ${partNumber}:`, error);
      throw error;
    }
  }

  async completeMultipartUpload(objectKey, uploadId, parts) {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map(p => ({
            ETag: p.ETag,
            PartNumber: p.PartNumber
          }))
        }
      });

      await this.client.send(command);
      logger.info(`Completed multipart upload for ${objectKey}`);
    } catch (error) {
      logger.error('Error completing multipart upload:', error);
      throw error;
    }
  }

  async abortMultipartUpload(objectKey, uploadId) {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        UploadId: uploadId
      });
      await this.client.send(command);
      logger.info(`Aborted multipart upload for ${objectKey}`);
    } catch (error) {
      logger.error('Error aborting multipart upload:', error);
      throw error;
    }
  }

  async getPresignedPlaybackUrl(objectKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey
      });

      const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      logger.error(`Error generating playback URL for ${objectKey}:`, error);
      throw error;
    }
  }

  async deleteObject(objectKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey
      });
      await this.client.send(command);
      logger.info(`Deleted object ${objectKey}`);
    } catch (error) {
      logger.error(`Error deleting object ${objectKey}:`, error);
      throw error;
    }
  }

  async headObject(objectKey) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey
      });
      const response = await this.client.send(command);
      return response;
    } catch (error) {
      if (error.name === 'NotFound') {
        return null;
      }
      logger.error(`Error heading object ${objectKey}:`, error);
      throw error;
    }
  }
}

module.exports = new R2Service();
