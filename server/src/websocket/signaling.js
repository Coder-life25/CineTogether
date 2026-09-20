const logger = require('../utils/logger');

function handleSignalingMessage(senderWs, data, roomSockets) {
  if (!roomSockets) return;

  const msgStr = JSON.stringify(data);
  roomSockets.forEach(client => {
    if (client !== senderWs && client.readyState === 1) { // WebSocket.OPEN is 1
      client.send(msgStr);
    }
  });
}

module.exports = { handleSignalingMessage };
