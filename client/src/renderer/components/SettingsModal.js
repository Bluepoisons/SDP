import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, RefreshCw, Trash2, Terminal } from 'lucide-react';
import useStore from '../store/useStore';

/**
 * 设置面板组件 (Task 2)
 * 包含：
 * 1. 记忆深度设置 (8-32)
 * 2. 日志查看器
 * 3. 清除会话历史
 */
export default function SettingsModal({ isOpen, onClose }) {
  const { 
    memoryMax, 
    setMemoryMax, 
    showLogs, 
    toggleLogs, 
    logs,
    fetchLogs,
    sessions,
    createNewSession
  } = useStore();

  // 打开面板时如果显示日志则自动获取
  useEffect(() => {
    if (isOpen && showLogs) {
      fetchLogs(100);
    }
  }, [isOpen, showLogs]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    if (confirm('确定要清除所有对话记录吗？此操作不可撤销。')) {
      createNewSession();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">系统设置</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Memory Setting */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-lg font-semibold text-white">记忆容量</label>
                  <p className="text-sm text-slate-400 mt-1">
                    AI 读取的历史对话数量（范围: 8-32 条）
                  </p>
                </div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {memoryMax} 条
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="8"
                  max="32"
                  step="2"
                  value={memoryMax}
                  onChange={e => setMemoryMax(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  style={{
                    background: `linear-gradient(to right, 
                      #06b6d4 0%, 
                      #06b6d4 ${((memoryMax - 8) / (32 - 8)) * 100}%, 
                      #334155 ${((memoryMax - 8) / (32 - 8)) * 100}%, 
                      #334155 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>8 (轻量)</span>
                  <span>16</span>
                  <span>24</span>
                  <span>32 (完整)</span>
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                  💡 <strong>建议</strong>: 记忆越多，AI 越能理解对话背景，但也会增加生成耗时。
                  <br />
                  <span className="text-slate-400">
                    • 短对话：8-12 条<br />
                    • 中等对话：16-20 条<br />
                    • 长对话：24-32 条
                  </span>
                </p>
              </div>
            </div>

            {/* Clear History */}
            <div className="border-t border-slate-700 pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-lg font-semibold text-white">清除所有对话</label>
                  <p className="text-sm text-slate-400 mt-1">
                    删除所有会话记录，重新开始
                  </p>
                </div>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  清除全部
                </button>
              </div>
            </div>

            {/* Developer Logs */}
            <div className="border-t border-slate-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-green-400" />
                  <label className="text-lg font-semibold text-white">开发者日志</label>
                </div>
                <div className="flex gap-2">
                  {showLogs && (
                    <button
                      onClick={() => fetchLogs(100)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      刷新
                    </button>
                  )}
                  <button
                    onClick={toggleLogs}
                    className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      showLogs
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {showLogs ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>

              {showLogs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-black rounded-lg p-4 font-mono text-xs overflow-auto max-h-64 border border-slate-700"
                >
                  <pre className="text-green-400 whitespace-pre-wrap">
                    {logs || '正在加载日志...'}
                  </pre>
                </motion.div>
              )}
            </div>

            {/* Stats */}
            <div className="border-t border-slate-700 pt-6 text-sm text-slate-400">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">当前会话数</span>
                  <div className="text-lg font-bold text-white mt-1">{sessions.length}</div>
                </div>
                <div>
                  <span className="text-slate-500">记忆模式</span>
                  <div className="text-lg font-bold text-cyan-400 mt-1">
                    {memoryMax < 16 ? '轻量' : memoryMax < 24 ? '标准' : '完整'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 p-6">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
            >
              关闭
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
