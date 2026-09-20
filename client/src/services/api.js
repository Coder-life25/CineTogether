import { API_BASE_URL } from '../lib/constants';

const request = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error?.message || `Request failed (${response.status})`);
    error.code = body.error?.code || 'REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }
  return response.json();
};

export const api = {
  createRoom: () => request('/rooms', { method: 'POST' }),
  joinRoom: (roomId) => request(`/rooms/${roomId}/join`, { method: 'POST' }),
  initiateUpload: (roomId, fileName, fileSize, contentType) => 
    request(`/rooms/${roomId}/video/upload`, { 
      method: 'POST', 
      body: JSON.stringify({ fileName, fileSize, contentType }) 
    }),
  completeUpload: (roomId, objectKey, uploadId, parts) => 
    request(`/rooms/${roomId}/video/complete`, { 
      method: 'POST', 
      body: JSON.stringify({ objectKey, uploadId, parts }) 
    }),
  getVideoUrl: (roomId) => request(`/rooms/${roomId}/video/url`),
  deleteVideo: (roomId) => request(`/rooms/${roomId}/video`, { method: 'DELETE' }),
  healthCheck: () => request('/health')
};
