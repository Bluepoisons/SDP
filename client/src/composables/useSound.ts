/**
 * 🎵 v12.0: useSound 组合式函数
 * 音效管理与播放系统 - 为 UI 交互增添"Juice"
 * 参考 Arknights, Blue Archive 的触感音效设计
 */

import { ref, Ref } from 'vue';

export interface SoundConfig {
  path: string;
  volume?: number;  // 0-1
  duration?: number;  // 音频时长 (ms)
  loop?: boolean;
}

interface SoundCache {
  audio: HTMLAudioElement;
  isPlaying: Ref<boolean>;
}

class SoundManager {
  private audioCache: Map<string, SoundCache> = new Map();
  private masterVolume: Ref<number> = ref(1);
  private soundsEnabled: Ref<boolean> = ref(true);

  /**
   * 🎵 播放音效
   * @param soundId 音效ID (如: 'click', 'select', 'success')
   * @param config 音效配置
   */
  play(soundId: string, config: SoundConfig): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.soundsEnabled.value) {
          resolve();
          return;
        }

        let audio = this.audioCache.get(soundId)?.audio;
        
        if (!audio) {
          // 首次创建音频元素
          audio = new Audio(config.path);
          this.audioCache.set(soundId, {
            audio,
            isPlaying: ref(false)
          });
        }

        // 配置音量
        const volume = (config.volume ?? 0.7) * this.masterVolume.value;
        audio.volume = Math.min(1, Math.max(0, volume));

        // 重置播放位置
        audio.currentTime = 0;

        // 播放完成回调
        const handleEnd = () => {
          const cache = this.audioCache.get(soundId);
          if (cache) {
            cache.isPlaying.value = false;
          }
          audio!.removeEventListener('ended', handleEnd);
          resolve();
        };

        const cache = this.audioCache.get(soundId);
        if (cache) {
          cache.isPlaying.value = true;
        }
        
        audio.addEventListener('ended', handleEnd, { once: true });
        
        // 超时保险（防止音频加载失败）
        const timeoutId = setTimeout(() => {
          if (cache) {
            cache.isPlaying.value = false;
          }
          resolve();
        }, (config.duration ?? 1000) + 500);

        audio.play().catch(() => {
          if (cache) {
            cache.isPlaying.value = false;
          }
          clearTimeout(timeoutId);
          resolve();
        });

      } catch (error) {
        console.error(`[SoundManager] Failed to play sound "${soundId}":`, error);
        resolve();
      }
    });
  }

  /**
   * 停止播放指定音效
   */
  stop(soundId: string): void {
    const cache = this.audioCache.get(soundId);
    if (cache) {
      cache.audio.pause();
      cache.audio.currentTime = 0;
      cache.isPlaying.value = false;
    }
  }

  /**
   * 停止所有音效
   */
  stopAll(): void {
    this.audioCache.forEach((cache) => {
      cache.audio.pause();
      cache.audio.currentTime = 0;
      cache.isPlaying.value = false;
    });
  }

  /**
   * 设置主音量
   */
  setMasterVolume(volume: number): void {
    this.masterVolume.value = Math.min(1, Math.max(0, volume));
  }

  /**
   * 获取主音量
   */
  getMasterVolume(): number {
    return this.masterVolume.value;
  }

  /**
   * 开启/关闭所有音效
   */
  toggleSound(enabled: boolean): void {
    this.soundsEnabled.value = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * 检查音效是否启用
   */
  isSoundEnabled(): boolean {
    return this.soundsEnabled.value;
  }

  /**
   * 预加载音效 (优化性能)
   */
  preload(soundId: string, config: SoundConfig): void {
    if (!this.audioCache.has(soundId)) {
      const audio = new Audio(config.path);
      this.audioCache.set(soundId, {
        audio,
        isPlaying: ref(false)
      });
    }
  }
}

// 🌍 全局单例
const soundManager = new SoundManager();

/**
 * 🎵 Vue 3 组合式函数: useSound
 * 在组件中使用音效
 * 
 * 示例:
 * const { playClick, playSuccess, playError } = useSound();
 * 
 * <button @click="playClick">Click Me</button>
 */
export function useSound() {
  /**
   * 📌 UI 点击音 - 轻快、简洁
   * 用途: 所有常规按钮点击
   */
  const playClick = async () => {
    await soundManager.play('click', {
      path: '/sounds/sfx/click.wav',
      volume: 0.6,
      duration: 100
    });
  };

  /**
   * 📬 消息接收音 - 温柔通知
   * 用途: AI 回复到达
   */
  const playReceive = async () => {
    await soundManager.play('receive', {
      path: '/sounds/sfx/message_receive.wav',
      volume: 0.5,
      duration: 400
    });
  };

  /**
   * ✅ 成功音 - 积极反馈
   * 用途: 选项确认、好感度提升
   */
  const playSuccess = async () => {
    await soundManager.play('success', {
      path: '/sounds/sfx/success.wav',
      volume: 0.7,
      duration: 600
    });
  };

  /**
   * ⚠️ 警告音 - 注意提示
   * 用途: 高风险选项、系统警告
   */
  const playWarning = async () => {
    await soundManager.play('warning', {
      path: '/sounds/sfx/warning.wav',
      volume: 0.6,
      duration: 400
    });
  };

  /**
   * ❌ 失败音 - 消极反馈
   * 用途: 关系破裂、操作失败
   */
  const playError = async () => {
    await soundManager.play('error', {
      path: '/sounds/sfx/error.wav',
      volume: 0.7,
      duration: 500
    });
  };

  /**
   * 💫 特殊事件音 - 暧昧/心动
   * 用途: 高分选项、浪漫时刻
   */
  const playRomantic = async () => {
    await soundManager.play('romantic', {
      path: '/sounds/sfx/romantic.wav',
      volume: 0.6,
      duration: 800
    });
  };

  /**
   * 🎯 选择确认音 - 坚定、清爽
   * 用途: 最终选项确认
   */
  const playSelectConfirm = async () => {
    await soundManager.play('select_confirm', {
      path: '/sounds/sfx/select_confirm.wav',
      volume: 0.75,
      duration: 500
    });
  };

  /**
   * 📊 数据流音 - 科技感
   * 用途: 正在生成、思考中
   */
  const playDataStream = async () => {
    await soundManager.play('data_stream', {
      path: '/sounds/sfx/data_stream.wav',
      volume: 0.4,
      duration: 2000,
      loop: false
    });
  };

  /**
   * 🔔 通知音 - 轻微、不打扰
   * 用途: 系统通知、后台消息
   */
  const playNotification = async () => {
    await soundManager.play('notification', {
      path: '/sounds/sfx/notification.wav',
      volume: 0.4,
      duration: 300
    });
  };

  /**
   * 🎵 背景音乐控制
   */
  const playBgm = async (musicId: string) => {
    await soundManager.play(`bgm_${musicId}`, {
      path: `/sounds/bgm/${musicId}.mp3`,
      volume: 0.3,
      loop: true
    });
  };

  /**
   * 停止背景音乐
   */
  const stopBgm = (musicId: string) => {
    soundManager.stop(`bgm_${musicId}`);
  };

  /**
   * 🔊 音量控制
   */
  const setMasterVolume = (volume: number) => {
    soundManager.setMasterVolume(volume);
  };

  const getMasterVolume = () => {
    return soundManager.getMasterVolume();
  };

  /**
   * 🔇 静音控制
   */
  const toggleMute = (muted: boolean) => {
    soundManager.toggleSound(!muted);
  };

  const isMuted = () => {
    return !soundManager.isSoundEnabled();
  };

  /**
   * 🎯 预加载关键音效 (在应用启动时调用)
   */
  const preloadSounds = () => {
    const sounds = [
      { id: 'click', path: '/sounds/sfx/click.wav' },
      { id: 'receive', path: '/sounds/sfx/message_receive.wav' },
      { id: 'success', path: '/sounds/sfx/success.wav' },
      { id: 'warning', path: '/sounds/sfx/warning.wav' },
      { id: 'error', path: '/sounds/sfx/error.wav' },
      { id: 'romantic', path: '/sounds/sfx/romantic.wav' },
      { id: 'select_confirm', path: '/sounds/sfx/select_confirm.wav' },
      { id: 'data_stream', path: '/sounds/sfx/data_stream.wav' },
    ];

    sounds.forEach(({ id, path }) => {
      soundManager.preload(id, { path });
    });
  };

  return {
    // 🎵 基础音效
    playClick,
    playReceive,
    playSuccess,
    playWarning,
    playError,
    playRomantic,
    playSelectConfirm,
    playDataStream,
    playNotification,

    // 🎶 音乐控制
    playBgm,
    stopBgm,

    // 🔊 音量控制
    setMasterVolume,
    getMasterVolume,

    // 🔇 静音控制
    toggleMute,
    isMuted,

    // ⚙️ 工具函数
    preloadSounds,
    stopAll: () => soundManager.stopAll(),
  };
}

/**
 * 🌍 导出全局实例 (用于 app.config.globalProperties)
 */
export { soundManager };
