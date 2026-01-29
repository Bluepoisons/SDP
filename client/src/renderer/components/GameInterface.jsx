import React, { useMemo, useState } from 'react';
import useGameStore from '../store/useGameStore';
import useTypewriter from '../hooks/useTypewriter';

const SCENE_CLASS_MAP = {
  '夕阳下的教室': 'bg-gradient-to-br from-amber-500/20 via-slate-900/40 to-indigo-900/50',
  '雨夜的走廊': 'bg-gradient-to-br from-slate-900/60 via-indigo-900/40 to-blue-900/40',
  '放学后的天台': 'bg-gradient-to-br from-sky-500/20 via-slate-900/40 to-purple-900/40',
};

const MOOD_PORTRAIT_MAP = {
  shy: '/assets/portraits/shy.png',
  angry: '/assets/portraits/angry.png',
  happy: '/assets/portraits/happy.png',
  sad: '/assets/portraits/sad.png',
  neutral: '/assets/portraits/neutral.png',
};

const STYLE_OPTIONS = [
  { code: 'TSUNDERE', label: '傲娇' },
  { code: 'YANDERE', label: '病娇' },
  { code: 'KUUDERE', label: '三无' },
  { code: 'GENKI', label: '元气' },
];

const GameInterface = () => {
  const [inputText, setInputText] = useState('');
  const {
    currentStyle,
    loading,
    error,
    scene,
    mood,
    text,
    options,
    selectedOptionIndex,
    setStyle,
    generateDialog,
    cancelGeneration,
    selectOption,
  } = useGameStore();

  const backgroundClass = useMemo(() => {
    if (!scene) return 'bg-slate-950';
    return SCENE_CLASS_MAP[scene] || 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950';
  }, [scene]);

  const portraitSrc = MOOD_PORTRAIT_MAP[mood] || MOOD_PORTRAIT_MAP.neutral;
  const { displayedText, isComplete } = useTypewriter(text, 28);

  const handleSubmit = (event) => {
    if (event) event.preventDefault();
    if (!inputText.trim()) return;
    generateDialog(inputText.trim());
    setInputText('');
  };

  return (
    <div className={`min-h-screen ${backgroundClass} text-slate-100 transition-colors duration-500`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-[0.2em]">SDP - SmartDialog Processor</h1>
          <p className="text-sm text-slate-400">沉浸式 Galgame 对话引擎 · 模型 JSON 协议输出</p>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            {STYLE_OPTIONS.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setStyle(item.code)}
                className={`rounded-full border px-4 py-1 text-xs tracking-[0.2em] transition-all ${
                  currentStyle === item.code
                    ? 'border-indigo-400 bg-indigo-400/20 text-indigo-200'
                    : 'border-white/10 text-slate-300 hover:border-indigo-300/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-[160px_1fr]">
            <div className="flex items-center justify-center">
              <div className="relative h-40 w-32 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                <img
                  src={portraitSrc}
                  alt={mood}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">
                  {mood}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-lg leading-relaxed">
                {displayedText || '等待你的输入...'}
                {!isComplete && text && <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-indigo-400" />}
              </div>

              <div
                className={`grid gap-3 transition-all duration-500 ${
                  isComplete && options.length > 0 ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                {options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectOption(index)}
                    className={`rounded-xl border border-white/10 bg-slate-900/60 p-4 text-left text-sm transition-all hover:border-indigo-300/60 hover:bg-slate-900/80 ${
                      selectedOptionIndex === index ? 'border-indigo-400 bg-indigo-500/10' : ''
                    }`}
                  >
                    <span className="mr-2 text-indigo-300">选项 {index + 1}</span>
                    {option}
                  </button>
                ))}
              </div>

              {!isComplete && text && (
                <p className="text-xs text-slate-500">旁白打字机进行中，选项将在完成后显示。</p>
              )}
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur"
        >
          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            rows={3}
            placeholder="输入对话文本，驱动剧情发展..."
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {scene ? `当前场景：${scene}` : '尚未生成场景'}
            </div>
            <div className="flex items-center gap-3">
              {loading && (
                <button
                  type="button"
                  onClick={cancelGeneration}
                  className="rounded-full border border-red-400/60 px-4 py-1 text-xs text-red-300"
                >
                  取消
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-indigo-500 px-5 py-2 text-xs font-semibold tracking-[0.2em] text-white transition hover:bg-indigo-400 disabled:opacity-60"
              >
                {loading ? '生成中...' : '生成'}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default GameInterface;
