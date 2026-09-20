const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateRoomId(length = 8) {
  const randomBytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += base62Chars[randomBytes[i] % base62Chars.length];
  }
  return result;
}

function generateParticipantId() {
  return uuidv4();
}

module.exports = {
  generateRoomId,
  generateParticipantId
};
