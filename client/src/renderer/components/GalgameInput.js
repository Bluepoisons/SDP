import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const STATUS_TEXTS = [
  'Syncing with timeline...',
  'Analyzing emotional spectrum...',
  'Weaving destiny threads...',
  'Calibrating resonance...'
];

const STYLE_OPTIONS = [
  { id: 'humorous', label: '幽默', accent: 'bg-amber-400' },
  { id: 'cold', label: '高冷', accent: 'bg-cyan-400' },
  { id: 'gentle', label: '温柔', accent: 'bg-rose-400' }
];

const GalgameInput = ({
  value,
  onChange,
  onSubmit,
  loading,
  timerMs,
  onCancel,
  onToggleScreenshot,
  onToggleImage,
  showImageInput,
  selectedStyle,
  onStyleChange
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const textareaRef = useRef(null);

  const thinkingSeconds = useMemo(() => Math.max(0, timerMs || 0) / 1000, [timerMs]);
  const typingIntensity = Math.min(1, (value || '').length / 40);

  useEffect(() => {
    if (!loading) {
      setStatusIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_TEXTS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
      {loading && (
        <motion.div
          className="mb-3 text-center text-xs tracking-widest text-indigo-200"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {STATUS_TEXTS[statusIndex]} ({thinkingSeconds.toFixed(1)}s)
        </motion.div>
      )}

      <div className="mb-2 flex items-center justify-center gap-2">
        {STYLE_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => onStyleChange(option.id)}
            className={`group flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs tracking-widest text-slate-200 transition-all duration-300 ease-out ${
              selectedStyle === option.id ? 'shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${option.accent}`} />
            {option.label}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className={`relative rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out ${
            isFocused ? 'shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          }`}
          animate={loading ? { scale: [1, 0.985, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/30 via-purple-500/70 to-indigo-500/30"
          style={{ opacity: typingIntensity }}
        />

        <div className="flex items-end gap-4 px-6 py-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter the dialogue to weave destiny..."
            rows={1}
            className="w-full resize-none bg-transparent text-lg tracking-wide text-slate-100 outline-none placeholder:text-slate-500"
            disabled={loading}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                onSubmit(event);
              }
            }}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Capture Reality"
              onClick={onToggleScreenshot}
              className="rounded-full border border-white/10 p-2 text-slate-200 transition-all duration-300 ease-out hover:bg-white/10"
            >
              📷
            </button>
            <button
              type="button"
              title={showImageInput ? 'Switch to Text' : 'Upload Image'}
              onClick={onToggleImage}
              className="rounded-full border border-white/10 p-2 text-slate-200 transition-all duration-300 ease-out hover:bg-white/10"
            >
              🖼️
            </button>

            <button
              type="button"
              onClick={loading ? onCancel : onSubmit}
              disabled={!loading && !value.trim()}
              className="relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={loading ? 'opacity-0' : 'opacity-100'}>Generate</span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-2 text-xs text-slate-400">
          <span>⌘/Ctrl + Enter to cast</span>
          <span>{loading ? 'Channeling...' : 'Ready to weave destiny'}</span>
        </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GalgameInput;
