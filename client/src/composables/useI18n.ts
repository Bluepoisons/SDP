/**
 * 🌐 响应式国际化 Composable
 * 使用 Vue 的 ref 实现语言切换的响应式更新
 */
import { ref, computed, watch } from 'vue'

type Locale = 'zh' | 'en'

interface Messages {
  [key: string]: {
    zh: string
    en: string
  }
}

const messages: Messages = {
  // 🎮 登录界面相关
  'login.pressAnyKey': {
    zh: '按任意键开始',
    en: 'PRESS ANY KEY TO START'
  },
  'login.subtitle': {
    zh: '神经同步·命运开启',
    en: 'Neural Sync · Destiny Unlocked'
  },
  'login.neuralLink': {
    zh: '神经链接',
    en: 'NEURAL LINK'
  },
  'login.createArchive': {
    zh: '建立新档案',
    en: 'Create Archive'
  },
  'login.initializeNeuralId': {
    zh: '初始化神经档案',
    en: 'INITIALIZE NEURAL ID'
  },
  'login.identifier': {
    zh: '识别码',
    en: 'Identifier'
  },
  'login.identifierPlaceholder': {
    zh: '输入你的代号...',
    en: 'Enter your codename...'
  },
  'login.password': {
    zh: '神经密钥',
    en: 'Neural Key'
  },
  'login.passwordPlaceholder': {
    zh: '输入神经密钥...',
    en: 'Enter neural key...'
  },
  'login.emergencyContact': {
    zh: '紧急联络频道',
    en: 'EMERGENCY CONTACT'
  },
  'login.emergencyContactPlaceholder': {
    zh: '邮箱 / 手机号（可选）',
    en: 'Email / Phone (optional)'
  },
  'login.refreshCaptcha': {
    zh: '点击刷新',
    en: 'Click to refresh'
  },
  'login.securityCode': {
    zh: '安全验证码',
    en: 'Security Code'
  },
  'login.securityCodePlaceholder': {
    zh: '输入图中字符',
    en: 'Enter the code'
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
    zh: '已有档案？同步连接',
    en: 'Have an account? Link Now'
  },
  'login.switchToRegister': {
    zh: '首次连接？建立档案',
    en: 'First time? Create Archive'
  },
  'login.guestMode': {
    zh: '游客模式',
    en: 'Guest Mode'
  },
  'login.version': {
    zh: '版本',
    en: 'ver'
  },
  'login.copyright': {
    zh: '© 2026 SmartDialog Processor',
    en: '© 2026 SmartDialog Processor'
  },
  'login.quote': {
    zh: '「在虚拟与现实的边界，我们再次相遇」',
    en: '"At the boundary of virtual and reality, we meet again"'
  },
  
  // 🔗 链接阶段
  'link.stage.init': {
    zh: '初始化神经接口',
    en: 'Initializing Neural Interface'
  },
  'link.stage.sync': {
    zh: '同步意识数据',
    en: 'Synchronizing Consciousness'
  },
  'link.stage.verify': {
    zh: '验证身份标识',
    en: 'Verifying Identity'
  },
  'link.stage.connect': {
    zh: '建立量子通道',
    en: 'Establishing Quantum Channel'
  },
  'link.stage.complete': {
    zh: '神经链接完成',
    en: 'Neural Link Complete'
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
  'status.loadingCaptcha': {
    zh: '加载验证码...',
    en: 'Loading captcha...'
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

// 🌐 响应式语言状态
const STORAGE_KEY = 'galgame_locale'
const currentLocale = ref<Locale>(loadStoredLocale())

function loadStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale
    if (stored && ['zh', 'en'].includes(stored)) {
      return stored
    }
  } catch (error) {
    console.warn('[I18n] Failed to load locale:', error)
  }
  return 'zh'
}

function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch (error) {
    console.warn('[I18n] Failed to save locale:', error)
  }
}

// 监听变化并保存
watch(currentLocale, (newLocale) => {
  saveLocale(newLocale)
  console.log(`🌐 [I18n] Language changed to: ${newLocale}`)
})

/**
 * 🌐 国际化 Composable
 */
export function useI18n() {
  /**
   * 📝 获取翻译文本
   */
  const t = (key: string, fallback?: string): string => {
    const message = messages[key]
    if (!message) {
      console.warn(`[I18n] Missing translation key: ${key}`)
      return fallback || key
    }
    return message[currentLocale.value] || message.zh || fallback || key
  }
  
  /**
   * 🔄 切换语言
   */
  const toggleLocale = () => {
    currentLocale.value = currentLocale.value === 'zh' ? 'en' : 'zh'
  }
  
  /**
   * 🎯 设置语言
   */
  const setLocale = (locale: Locale) => {
    currentLocale.value = locale
  }
  
  /**
   * 🌍 当前语言
   */
  const locale = computed(() => currentLocale.value)
  
  /**
   * 🎨 当前语言名称
   */
  const localeName = computed(() => {
    return currentLocale.value === 'zh' ? '中文' : 'English'
  })
  
  /**
   * 🌍 是否为中文
   */
  const isZh = computed(() => currentLocale.value === 'zh')
  
  /**
   * 🌍 是否为英文
   */
  const isEn = computed(() => currentLocale.value === 'en')
  
  return {
    t,
    locale,
    localeName,
    isZh,
    isEn,
    toggleLocale,
    setLocale
  }
}

export default useI18n
