import { API_BASE_URL } from '../lib/constants';

// Every video route is scoped to a participant seat, so the server wants the id the join handed
// us back on each call. It lives here rather than being threaded through every component that
// happens to sit between the room and an upload button.
let participantId = null;

export const setParticipantId = (id) => { participantId = id || null; };
export const getParticipantId = () => participantId;

const request = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(participantId ? { 'X-Participant-Id': participantId } : {}),
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
  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  setParticipantId,
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
