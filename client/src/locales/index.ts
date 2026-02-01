/**
 * 🌐 Gal❤Game 国际化系统
 * 支持中文/英文切换的二次元风格消息系统
 */

type Locale = 'zh' | 'en'

interface Messages {
  [key: string]: {
    zh: string
    en: string
  }
}

const messages: Messages = {
  // 🎮 登录界面相关
  'login.subtitle': {
    zh: '神经同步·命运开启',
    en: 'Neural Sync · Destiny Unlocked'
  },
  'login.neuralLink': {
    zh: '神经链接',
    en: 'NEURAL LINK'
  },
  'login.initializeNeuralId': {
    zh: '初始化神经档案',
    en: 'INITIALIZE NEURAL ID'
  },
  'login.emergencyContact': {
    zh: '紧急联络频道',
    en: 'EMERGENCY CONTACT'
  },
  'login.refreshCaptcha': {
    zh: '点击刷新',
    en: 'Click to refresh'
  },
  'login.securityCode': {
    zh: '安全验证码',
    en: 'Security Code'
  },
  'login.initializeId': {
    zh: '初始化档案',
    en: 'Initialize ID'
  },
  'login.linkStart': {
    zh: '链接开始！',
    en: 'LINK START!'
  },
  'login.switchToLogin': {
    zh: '返回登录',
    en: 'Back to Login'
  },
  'login.switchToRegister': {
    zh: '创建新档案',
    en: 'Create New Archive'
  },
  'login.guestMode': {
    zh: '游客模式',
    en: 'Guest Mode'
  },
  
  // 🔄 操作相关
  'actions.switchLanguage': {
    zh: '切换语言',
    en: 'Switch Language'
  },
  
  // 🚫 错误消息（二次元化）
  'errors.neuralSyncFailed': {
    zh: '神经同步失败，请重新尝试连接',
    en: 'Neural sync failed, please retry connection'
  },
  'errors.userNotFound': {
    zh: '未发现该指挥官档案',
    en: 'Commander archive not found'
  },
  'errors.captchaInvalid': {
    zh: '安全验证码错误',
    en: 'Security code invalid'
  },
  'errors.captchaExpired': {
    zh: '验证码已过期，请刷新重试',
    en: 'Captcha expired, please refresh'
  },
  'errors.validationError': {
    zh: '输入数据格式错误',
    en: 'Input validation error'
  },
  'errors.connectionFailed': {
    zh: '网络连接异常，请检查网络状态',
    en: 'Connection failed, check network status'
  },
  
  // ✅ 成功消息
  'success.loginSuccess': {
    zh: '神经链接建立成功！',
    en: 'Neural link established successfully!'
  },
  'success.registerSuccess': {
    zh: '新指挥官档案创建完成',
    en: 'New commander archive created'
  },
  
  // 📊 状态消息
  'status.connecting': {
    zh: '正在建立神经链接...',
    en: 'Establishing neural link...'
  },
  'status.syncInProgress': {
    zh: '数据同步中',
    en: 'Data synchronization in progress'
  },
  'status.ready': {
    zh: '系统就绪',
    en: 'System ready'
  },
  
  // 🎭 用户界面
  'ui.welcome': {
    zh: '欢迎回来，指挥官',
    en: 'Welcome back, Commander'
  },
  'ui.loading': {
    zh: '加载中...',
    en: 'Loading...'
  },
  'ui.confirm': {
    zh: '确认',
    en: 'Confirm'
  },
  'ui.cancel': {
    zh: '取消',
    en: 'Cancel'
  }
}

/**
 * 🌐 国际化管理类（单例模式）
 */
export class I18n {
  private static instance: I18n
  private _locale: Locale = 'zh'
  private readonly STORAGE_KEY = 'galgame_locale'
  
  private constructor() {
    this.loadLocale()
  }
  
  static getInstance(): I18n {
    if (!I18n.instance) {
      I18n.instance = new I18n()
    }
    return I18n.instance
  }
  
  get locale(): Locale {
    return this._locale
  }
  
  set locale(newLocale: Locale) {
    this._locale = newLocale
    this.saveLocale()
  }
  
  /**
   * 🔄 切换语言
   */
  toggle(): void {
    this.locale = this._locale === 'zh' ? 'en' : 'zh'
  }
  
  /**
   * 📝 获取翻译文本
   * @param key 消息键
   * @param fallback 备用文本
   */
  t(key: string, fallback?: string): string {
    const message = messages[key]
    if (!message) {
      console.warn(`[I18n] Missing translation key: ${key}`)
      return fallback || key
    }
    
    return message[this._locale] || message.zh || fallback || key
  }
  
  /**
   * 💾 保存语言设置到本地存储
   */
  private saveLocale(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, this._locale)
    } catch (error) {
      console.warn('[I18n] Failed to save locale:', error)
    }
  }
  
  /**
   * 🔄 从本地存储加载语言设置
   */
  private loadLocale(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY) as Locale
      if (stored && ['zh', 'en'].includes(stored)) {
        this._locale = stored
      }
    } catch (error) {
      console.warn('[I18n] Failed to load locale:', error)
    }
  }
  
  /**
   * 🌍 获取可用语言列表
   */
  getAvailableLocales(): { code: Locale; name: string }[] {
    return [
      { code: 'zh', name: '中文' },
      { code: 'en', name: 'English' }
    ]
  }
  
  /**
   * 🎨 获取当前语言的显示名称
   */
  getCurrentLocaleName(): string {
    const locales = this.getAvailableLocales()
    return locales.find(l => l.code === this._locale)?.name || '中文'
  }
}

// 导出默认实例
export default I18n