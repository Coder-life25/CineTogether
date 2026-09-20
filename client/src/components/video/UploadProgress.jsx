import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

const UploadProgress = ({ progress, fileName, onCancel }) => {
  return (
    <div className="bg-secondary p-6 rounded-xl border border-border space-y-4">
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="font-medium text-text-primary truncate mr-4">{fileName}</span>
        <span className="text-accent font-bold">{progress}%</span>
      </div>
      
      <div className="w-full h-2 bg-primary rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-accent to-accent-glow"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut" }}
        />
      </div>
      
      <div className="flex justify-end pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel} icon={X}>
          Cancel Upload
        </Button>
      </div>
    </div>
  );
};

export default UploadProgress;
