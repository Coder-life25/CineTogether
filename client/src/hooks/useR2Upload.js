import { useState, useRef } from 'react';
import { api } from '../services/api';
import { PART_SIZE, MAX_CONCURRENT_UPLOADS } from '../lib/constants';

export const useR2Upload = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const startUpload = async (roomId, file) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const initRes = await api.initiateUpload(roomId, file.name, file.size, file.type);
      const { uploadId, objectKey, presignedUrls } = initRes;
      const partsCount = presignedUrls.length;

      const parts = [];
      let uploadedParts = 0;

      const uploadPart = async (partNumber) => {
        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const chunk = file.slice(start, end);

        const presignedUrlObj = presignedUrls.find(p => p.partNumber === partNumber);
        if (!presignedUrlObj) throw new Error(`No presigned URL for part ${partNumber}`);

        const response = await fetch(presignedUrlObj.url, {
          method: 'PUT',
          body: chunk,
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) throw new Error(`Failed to upload part ${partNumber}`);

        // Removing quotes from ETag if present, S3 sometimes wraps them
        let eTag = response.headers.get('ETag');
        if (eTag) eTag = eTag.replace(/"/g, '');
        
        parts.push({ PartNumber: partNumber, ETag: eTag });
        uploadedParts++;
        setProgress(Math.round((uploadedParts / partsCount) * 100));
      };

      // Simple concurrency limiting
      const queue = Array.from({ length: partsCount }, (_, i) => i + 1);
      const workers = Array(Math.min(MAX_CONCURRENT_UPLOADS, partsCount)).fill(null).map(async () => {
        while (queue.length > 0) {
          const partNum = queue.shift();
          await uploadPart(partNum);
        }
      });

      await Promise.all(workers);

      // Sort parts by PartNumber before completing
      parts.sort((a, b) => a.PartNumber - b.PartNumber);

      const completeRes = await api.completeUpload(roomId, objectKey, uploadId, parts);
      setIsUploading(false);
      return completeRes.playbackUrl;

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
      setIsUploading(false);
      throw err;
    }
  };

  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return { startUpload, progress, isUploading, error, abort };
};
