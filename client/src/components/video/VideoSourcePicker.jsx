import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { parseVideoUrl, SOURCE_LABELS } from '../../lib/urlUtils';
import { Upload, Youtube, Link as LinkIcon, Facebook, Instagram, Film, AlertCircle } from 'lucide-react';
import { useR2Upload } from '../../hooks/useR2Upload';
import UploadProgress from './UploadProgress';
import { motion, AnimatePresence } from 'framer-motion';

const SOURCE_ICONS = {
  youtube: Youtube,
  facebook: Facebook,
  instagram: Instagram,
  direct: Film
};

const UNSUPPORTED_MESSAGE = "This link can't be played here. Paste a YouTube, Facebook, Instagram or direct video (.mp4 / .webm) link.";

const VideoSourcePicker = ({ roomId, isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState('link');
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState(null);
  
  const { startUpload, progress, isUploading, error, abort } = useR2Upload();

  const detected = useMemo(() => parseVideoUrl(url), [url]);
  const showUnsupported = submitted && url.trim() && !detected;

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (detected) onSelect(detected);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      const videoUrl = await startUpload(roomId, file);
      onSelect({ type: 'r2', url: videoUrl });
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'link', icon: LinkIcon, label: 'Paste link' },
    { id: 'upload', icon: Upload, label: 'Upload' }
  ];

  const DetectedIcon = detected ? SOURCE_ICONS[detected.type] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Video Source">
      <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-lg overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-elevated text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'link' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <Input
                placeholder="Paste a YouTube, Facebook, Instagram or .mp4 link..."
                value={url}
                onChange={(e) => { setUrl(e.target.value); setSubmitted(false); }}
                icon={LinkIcon}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                error={showUnsupported ? UNSUPPORTED_MESSAGE : undefined}
              />

              <div className="min-h-[1.5rem] text-sm">
                {detected && DetectedIcon && (
                  <span className="inline-flex items-center gap-2 text-text-secondary">
                    <DetectedIcon className="w-4 h-4 text-accent" />
                    {SOURCE_LABELS[detected.type]} detected
                    {detected.type === 'youtube' && detected.start > 0 && ` · starts at ${detected.start}s`}
                    {(detected.type === 'facebook' || detected.type === 'instagram') && ' · plays on both sides, press play together'}
                  </span>
                )}
                {!detected && url.trim() && !submitted && (
                  <span className="inline-flex items-center gap-2 text-text-secondary">
                    <AlertCircle className="w-4 h-4" />
                    Not a supported link yet
                  </span>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!url.trim()}>Play Video</Button>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1"><Youtube className="w-3.5 h-3.5" /> YouTube (synced)</span>
                <span className="inline-flex items-center gap-1"><Facebook className="w-3.5 h-3.5" /> Facebook</span>
                <span className="inline-flex items-center gap-1"><Instagram className="w-3.5 h-3.5" /> Instagram</span>
                <span className="inline-flex items-center gap-1"><Film className="w-3.5 h-3.5" /> .mp4 / .webm (synced)</span>
              </div>
            </form>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              {isUploading ? (
                <UploadProgress progress={progress} fileName={file?.name} onCancel={abort} />
              ) : (
                <>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e) => setFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-text-secondary mx-auto mb-3" />
                    <p className="text-text-primary font-medium mb-1">Click or drag video file to upload</p>
                    <p className="text-xs text-text-secondary">MP4, WebM up to 2GB</p>
                  </div>
                  {file && (
                    <div className="p-3 bg-secondary rounded-lg border border-border flex items-center justify-between">
                      <span className="text-sm truncate mr-4">{file.name}</span>
                      <Button onClick={handleUpload} size="sm">Start Upload</Button>
                    </div>
                  )}
                  {error && <p className="text-accent text-sm">{error}</p>}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default VideoSourcePicker;
