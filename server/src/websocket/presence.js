// Which participants currently hold an open socket, per room. Lets the join flow tell a
// partner who is really here apart from one whose tab was closed without leaving.
const live = new Map(); // roomId -> Set<participantId>

function add(roomId, participantId) {
  if (!live.has(roomId)) live.set(roomId, new Set());
  live.get(roomId).add(participantId);
}

function remove(roomId, participantId) {
  const set = live.get(roomId);
  if (!set) return;
  set.delete(participantId);
  if (set.size === 0) live.delete(roomId);
}

function has(roomId, participantId) {
  const set = live.get(roomId);
  return !!set && set.has(participantId);
}

function list(roomId) {
  return Array.from(live.get(roomId) || []);
}

module.exports = { add, remove, has, list };
