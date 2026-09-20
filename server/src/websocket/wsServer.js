const WebSocket = require('ws');
const url = require('url');
const roomService = require('../services/roomService');
const logger = require('../utils/logger');
const { handleSignalingMessage } = require('./signaling');
const { validateMessage } = require('./validation');
const presence = require('./presence');

const MAX_PAYLOAD = 64 * 1024; // 64KB
// A dropped socket gets this long to reconnect before the participant is removed from the room
const LEAVE_GRACE_MS = 5000;
const HEARTBEAT_MS = 10000;

class WSServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, maxPayload: MAX_PAYLOAD });
    this.rooms = new Map(); // Map<roomId, Set<WebSocket>>
    this.setupListeners();
  }

  setupListeners() {
    this.wss.on('connection', async (ws, req) => {
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });
      // Hold incoming frames until the participant is validated and handlers are attached:
      // a joiner's first WebRTC offer arrives within milliseconds of the handshake.
      ws.pause();

      try {
        const parsedUrl = url.parse(req.url, true);
        const { roomId, participantId } = parsedUrl.query;

        if (!roomId || !participantId) {
          ws.resume();
          ws.close(1008, 'Missing roomId or participantId');
          return;
        }

        await roomService.validateParticipant(roomId, participantId);
        
        ws.roomId = roomId;
        ws.participantId = participantId;

        if (!this.rooms.has(roomId)) {
          this.rooms.set(roomId, new Set());
        }
        
        const roomSockets = this.rooms.get(roomId);
        if (roomSockets.size >= 2) {
            ws.resume();
            ws.close(1008, 'Room full');
            return;
        }

        roomSockets.add(ws);
        presence.add(roomId, participantId);
        logger.info(`WS Connection established for participant ${participantId} in room ${roomId}`);

        // Broadcast participant joined
        this.broadcast(roomId, ws, {
            type: 'participant_joined',
            payload: { participantId }
        });

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            validateMessage(data);
            handleSignalingMessage(ws, data, this.rooms.get(roomId));
            roomService.updateActivity(roomId).catch(err => logger.error('Error updating activity', err));
          } catch (error) {
            logger.warn(`Invalid WS message from ${participantId}:`, error.message);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format or type' }));
          }
        });

        ws.on('close', () => {
          logger.info(`WS Connection closed for participant ${participantId} in room ${roomId}`);
          presence.remove(roomId, participantId);
          const roomSockets = this.rooms.get(roomId);
          if (roomSockets) {
            roomSockets.delete(ws);
            if (roomSockets.size === 0) {
              this.rooms.delete(roomId);
            } else {
               this.broadcast(roomId, ws, {
                  type: 'participant_left',
                  payload: { participantId }
               });
            }
          }
          // Free the seat unless the same participant reconnected in the meantime, so a
          // refreshed tab can join again instead of finding the room full.
          setTimeout(() => {
            if (presence.has(roomId, participantId)) return;
            roomService.leaveRoom(roomId, participantId)
              .catch(err => logger.error(`Error releasing seat for ${participantId} in room ${roomId}:`, err.message));
          }, LEAVE_GRACE_MS);
        });

        ws.resume();
      } catch (error) {
        logger.error('WS Connection error:', error);
        ws.resume();
        ws.close(1008, 'Authentication failed or room error');
      }
    });

    // Heartbeat: catch dead sockets (crashed tab, lost network) quickly so their room seat frees up.
    this.interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
           logger.debug(`Terminating dead connection for ${ws.participantId}`);
           return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, HEARTBEAT_MS);

    this.wss.on('close', () => {
      clearInterval(this.interval);
    });
  }

  broadcast(roomId, senderWs, message) {
    const roomSockets = this.rooms.get(roomId);
    if (roomSockets) {
      const msgStr = JSON.stringify(message);
      roomSockets.forEach(client => {
        if (client !== senderWs && client.readyState === WebSocket.OPEN) {
          client.send(msgStr);
        }
      });
    }
  }
}

module.exports = WSServer;
