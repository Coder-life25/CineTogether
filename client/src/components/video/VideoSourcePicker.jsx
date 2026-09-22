import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { parseVideoUrl, SOURCE_LABELS, embedBlockedHost } from '../../lib/urlUtils';
import { Upload, Youtube, Link as LinkIcon, Facebook, Instagram, Film, AlertCircle, MonitorUp, Volume2 } from 'lucide-react';
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

const VideoSourcePicker = ({ roomId, isOpen, onClose, onSelect, screenShare, onShareScreen }) => {
  const [activeTab, setActiveTab] = useState('link');
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState(null);
  
  const { startUpload, progress, isUploading, error, abort } = useR2Upload();

  const detected = useMemo(() => parseVideoUrl(url), [url]);
  const blockedHost = useMemo(() => (detected ? null : embedBlockedHost(url)), [url, detected]);
  const showUnsupported = submitted && url.trim() && !detected && !blockedHost;
  const canShareScreen = !!(screenShare && screenShare.isSupported && onShareScreen);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (detected) onSelect(detected);
    else if (blockedHost) setActiveTab('screen');
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
    { id: 'upload', icon: Upload, label: 'Upload' },
    { id: 'screen', icon: MonitorUp, label: 'Share screen' }
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
                {!detected && !blockedHost && url.trim() && !submitted && (
                  <span className="inline-flex items-center gap-2 text-text-secondary">
                    <AlertCircle className="w-4 h-4" />
                    Not a supported link yet
                  </span>
                )}
              </div>

              {/* Streaming sites refuse to load inside another page, so a link is a dead end here.
                  Sharing the tab plays it once, on one machine, and both of you watch that. */}
              {blockedHost && (
                <div className="rounded-lg border border-border bg-secondary/60 p-4 space-y-3">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{blockedHost}</span> blocks playback inside other
                    sites, so it can&apos;t be opened from a link here.
                  </p>
                  <p className="text-sm text-text-secondary">
                    Share your screen instead: play it in your own tab and your partner watches
                    along — one playback, so you&apos;re in sync with nothing to press.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    icon={MonitorUp}
                    onClick={() => setActiveTab('screen')}
                  >
                    Share screen instead
                  </Button>
                </div>
              )}

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

          {activeTab === 'screen' && (
            <div className="space-y-4">
              <div className="border border-border rounded-xl p-6 text-center bg-secondary/50">
                <MonitorUp className="w-8 h-8 text-accent mx-auto mb-3" />
                <p className="text-text-primary font-medium mb-1">Share the tab you&apos;re watching in</p>
                <p className="text-sm text-text-secondary">
                  For anything that won&apos;t play from a link — a streaming site, a service with
                  DRM, a player that only works on its own page. It runs on your machine and your
                  partner sees exactly what you see.
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <Volume2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <span>
                  Pick the <span className="text-text-primary">Chrome Tab</span> the movie is in and
                  turn on <span className="text-text-primary">Also share tab audio</span>, otherwise
                  they&apos;ll watch it silently.
                </span>
              </div>

              {canShareScreen ? (
                <Button className="w-full" icon={MonitorUp} onClick={onShareScreen}>
                  Share my screen
                </Button>
              ) : (
                <p className="text-accent text-sm">
                  This browser can&apos;t share a screen. Use Chrome, Edge or Firefox on a computer —
                  iPhones and iPads don&apos;t offer it at all.
                </p>
              )}
              {screenShare && screenShare.error && (
                <p className="text-accent text-sm">{screenShare.error}</p>
              )}

              <p className="text-xs text-text-secondary">
                One playback, two viewers — there&apos;s no second player to keep in step, so neither
                of you has to press play.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default VideoSourcePicker;
