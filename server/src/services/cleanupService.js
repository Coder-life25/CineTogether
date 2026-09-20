const cron = require('node-cron');
const VideoMeta = require('../models/VideoMeta');
const r2Service = require('./r2Service');
const logger = require('../utils/logger');

class CleanupService {
  constructor() {
    this.primaryJob = null;
    this.safetyJob = null;
  }

  startCleanupScheduler() {
    logger.info('Starting cleanup schedulers');
    
    // Primary cleanup: runs every 15 minutes
    this.primaryJob = cron.schedule('*/15 * * * *', async () => {
      logger.info('Running primary cleanup job');
      await this.runPrimaryCleanup();
    });

    // Safety cleanup: runs every 30 minutes
    this.safetyJob = cron.schedule('*/30 * * * *', async () => {
      logger.info('Running safety cleanup job');
      await this.runSafetyCleanup();
    });
  }

  stopCleanupScheduler() {
    if (this.primaryJob) {
      this.primaryJob.stop();
      logger.info('Stopped primary cleanup scheduler');
    }
    if (this.safetyJob) {
      this.safetyJob.stop();
      logger.info('Stopped safety cleanup scheduler');
    }
  }

  async runPrimaryCleanup() {
    try {
      const now = new Date();
      const expiredVideos = await VideoMeta.find({
        expiresAt: { $lte: now },
        status: 'active'
      });

      for (const video of expiredVideos) {
        await this._deleteAndMark(video, 'primary cleanup');
      }
      
      if(expiredVideos.length > 0) {
          logger.info(`Primary cleanup processed ${expiredVideos.length} videos`);
      }
    } catch (error) {
      logger.error('Error in primary cleanup:', error);
    }
  }

  async runSafetyCleanup() {
    try {
      const now = new Date();
      const staleVideos = await VideoMeta.find({
        safetyExpiresAt: { $lte: now },
        status: { $ne: 'deleted' }
      });

      for (const video of staleVideos) {
        await this._deleteAndMark(video, 'safety cleanup');
      }
      
      if(staleVideos.length > 0) {
          logger.info(`Safety cleanup processed ${staleVideos.length} videos`);
      }
    } catch (error) {
      logger.error('Error in safety cleanup:', error);
    }
  }
  
  async _deleteAndMark(video, source) {
      try {
          await r2Service.deleteObject(video.objectKey);
          video.status = 'deleted';
          await video.save();
          logger.info(`Deleted object ${video.objectKey} via ${source}`);
      } catch (err) {
          logger.error(`Failed to delete ${video.objectKey} via ${source}:`, err);
      }
  }

  async deleteVideoNow(roomId, objectKey) {
    try {
      await r2Service.deleteObject(objectKey);
      await VideoMeta.findOneAndUpdate(
        { roomId, objectKey },
        { status: 'deleted' }
      );
      logger.info(`Immediate deletion successful for ${objectKey} in room ${roomId}`);
    } catch (error) {
      logger.error(`Error in immediate deletion for ${objectKey}:`, error);
      throw error;
    }
  }
}

module.exports = new CleanupService();
