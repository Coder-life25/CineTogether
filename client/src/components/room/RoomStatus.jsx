import React from 'react';
import { Users } from 'lucide-react';

const RoomStatus = ({ participantCount, isSyncing }) => {
  return (
    <div className="flex items-center gap-4 text-sm text-text-secondary">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>{participantCount} {participantCount === 1 ? 'Person' : 'People'}</span>
      </div>
      {isSyncing && (
        <div className="flex items-center gap-1 text-accent">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>Syncing...</span>
        </div>
      )}
    </div>
  );
};

export default RoomStatus;
