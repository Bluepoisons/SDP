import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 🔐 认证状态管理器
 * 支持手动登录、OAuth登录、游客模式
 */
export const useAuthStore = defineStore('auth', () => {
  
  // 🔗 连接状态
  const isLinking = ref(false)
  const connectionStartTime = ref<number | null>(null)
  
  // 👤 用户信息
  const user = ref<{
    id: string
    username: string
    email?: string
    avatar?: string
    provider?: 'manual' | 'github' | 'qq' | 'wechat' | 'guest'
    neuralId: string
    accessLevel: number
  } | null>(null)
  
  // 🛡️ 认证令牌
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  
  // 🎯 验证码
  const captchaImage = ref<string | null>(null)
  const captchaId = ref<string | null>(null)
  
  // 🚫 错误状态
  const lastError = ref<string | null>(null)
  
  // 💾 本地存储 Key
  const STORAGE_KEY = 'galgame_auth'
  
  // ✅ 计算属性
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
  const connectionDuration = computed(() => {
    if (!connectionStartTime.value) return 0
    return Date.now() - connectionStartTime.value
  })
  
  /**
   * 🛡️ 获取验证码
   */
  const getCaptcha = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8002/api/auth/captcha', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`验证码获取失败: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // 根据 image_type 设置正确的 MIME 类型
        const imageType = data.data.image_type || 'png'
        const mimeType = imageType.includes('svg') ? 'image/svg+xml' : `image/${imageType}`
        captchaImage.value = `data:${mimeType};base64,${data.data.image}`
        captchaId.value = data.data.captcha_id
      } else {
        throw new Error(data.message || '验证码获取失败')
      }
      
    } catch (error) {
      console.error('Get captcha failed:', error)
      captchaImage.value = null
      captchaId.value = null
      throw error
    }
  }
  
  /**
   * 🔗 开始神经链接 (登录)
   */
  const linkStart = async (identifier: string, password: string, captcha: string) => {
    if (isLinking.value) return
    
    try {
      isLinking.value = true
      connectionStartTime.value = Date.now()
      lastError.value = null
      
      const response = await fetch('http://127.0.0.1:8002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password,
          captcha,
          captcha_id: captchaId.value
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // 保存用户信息和令牌
        user.value = {
          id: data.data.user_id,
          username: data.data.username,
          email: data.data.email,
          neuralId: data.data.neural_id || `CMD-${data.data.user_id.slice(0, 8).toUpperCase()}`,
          accessLevel: data.data.access_level || 1,
          provider: 'manual'
        }
        
        accessToken.value = data.data.access_token
        refreshToken.value = data.data.refresh_token
        
        // 持久化存储
        saveAuthData()
        
        return data.data
      } else {
        throw new Error(data.message || '神经链接失败')
      }
      
    } catch (error: any) {
      console.error('Neural link failed:', error)
      lastError.value = error.message || '神经同步异常'
      throw error
    } finally {
      isLinking.value = false
      connectionStartTime.value = null
    }
  }
  
  /**
   * 🆔 注册新的神经档案
   */
  const register = async (
    identifier: string, 
    password: string, 
    captcha: string, 
    emergencyContact?: string
  ) => {
    if (isLinking.value) return
    
    try {
      isLinking.value = true
      connectionStartTime.value = Date.now()
      lastError.value = null
      
      const response = await fetch('http://127.0.0.1:8002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password,
          captcha,
          captcha_id: captchaId.value,
          emergency_contact: emergencyContact
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // 注册成功后自动登录
        user.value = {
          id: data.data.user_id,
          username: data.data.username,
          email: data.data.email,
          neuralId: data.data.neural_id || `CMD-${data.data.user_id.slice(0, 8).toUpperCase()}`,
          accessLevel: 1,
          provider: 'manual'
        }
        
        accessToken.value = data.data.access_token
        refreshToken.value = data.data.refresh_token
        
        // 持久化存储
        saveAuthData()
        
        return data.data
      } else {
        throw new Error(data.message || '神经档案初始化失败')
      }
      
    } catch (error: any) {
      console.error('Registration failed:', error)
      lastError.value = error.message || '档案创建异常'
      throw error
    } finally {
      isLinking.value = false
      connectionStartTime.value = null
    }
  }
  
  /**
   * 🌐 OAuth 登录处理
   * 处理从后端 OAuth 回调返回的结果
   */
  const handleOAuthCallback = async (provider: string, searchParams: URLSearchParams) => {
    try {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      
      if (error) {
        throw new Error(`OAuth ${provider} 认证失败: ${error}`)
      }
      
      if (!code) {
        throw new Error('OAuth 认证码缺失')
      }
      
      isLinking.value = true
      connectionStartTime.value = Date.now()
      lastError.value = null
      
      const response = await fetch(`http://127.0.0.1:8002/api/auth/oauth/${provider}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ code })
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        user.value = {
          id: data.data.user_id,
          username: data.data.username,
          email: data.data.email,
          avatar: data.data.avatar,
          neuralId: data.data.neural_id || `${provider.toUpperCase()}-${data.data.user_id.slice(0, 8)}`,
          accessLevel: data.data.access_level || 1,
          provider: provider as any
        }
        
        accessToken.value = data.data.access_token
        refreshToken.value = data.data.refresh_token
        
        saveAuthData()
        
        return data.data
      } else {
        throw new Error(data.message || `${provider} 登录失败`)
      }
      
    } catch (error: any) {
      console.error(`OAuth ${provider} failed:`, error)
      lastError.value = error.message || `${provider} 认证异常`
      throw error
    } finally {
      isLinking.value = false
      connectionStartTime.value = null
    }
  }
  
  /**
   * 🎭 游客模式登录
   */
  const enterGuestMode = async () => {
    try {
      isLinking.value = true
      connectionStartTime.value = Date.now()
      lastError.value = null
      
      // 生成临时游客 ID
      const guestId = `GUEST-${Date.now().toString(36).toUpperCase()}`
      
      user.value = {
        id: guestId,
        username: `游客${guestId.slice(-6)}`,
        neuralId: guestId,
        accessLevel: 0,
        provider: 'guest'
      }
      
      // 游客模式不需要真实令牌，使用临时标识
      accessToken.value = `guest_${guestId}`
      refreshToken.value = null
      
      // 游客模式不持久化存储
      console.log('🎭 Guest mode activated:', user.value.username)
      
      return user.value
      
    } catch (error: any) {
      console.error('Guest mode failed:', error)
      lastError.value = error.message || '游客模式启动失败'
      throw error
    } finally {
      isLinking.value = false
      connectionStartTime.value = null
    }
  }
  
  /**
   * 🔄 刷新访问令牌
   */
  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      throw new Error('没有刷新令牌')
    }
    
    try {
      const response = await fetch('http://127.0.0.1:8002/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken.value}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.data) {
        accessToken.value = data.data.access_token
        
        // 如果有新的刷新令牌，也更新
        if (data.data.refresh_token) {
          refreshToken.value = data.data.refresh_token
        }
        
        saveAuthData()
        return data.data.access_token
      } else {
        throw new Error(data.message || '令牌刷新失败')
      }
      
    } catch (error) {
      console.error('Token refresh failed:', error)
      // 刷新失败，清除认证信息
      logout()
      throw error
    }
  }
  
  /**
   * 🚪 神经链接断开 (登出)
   */
  const logout = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    captchaImage.value = null
    captchaId.value = null
    lastError.value = null
    
    // 清除本地存储
    localStorage.removeItem(STORAGE_KEY)
    
    console.log('🚪 Neural link disconnected')
  }
  
  /**
   * 💾 保存认证数据到本地存储
   */
  const saveAuthData = () => {
    if (user.value?.provider === 'guest') {
      // 游客模式不持久化
      return
    }
    
    const authData = {
      user: user.value,
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
    } catch (error) {
      console.warn('Failed to save auth data:', error)
    }
  }
  
  /**
   * 🔄 从本地存储恢复认证状态
   */
  const restoreAuthData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      
      const authData = JSON.parse(stored)
      const { user: storedUser, accessToken: storedToken, refreshToken: storedRefresh, timestamp } = authData
      
      // 检查数据是否过期 (7天)
      const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000
      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      
      user.value = storedUser
      accessToken.value = storedToken
      refreshToken.value = storedRefresh
      
      console.log('🔄 Auth state restored:', storedUser?.username)
      
    } catch (error) {
      console.warn('Failed to restore auth data:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }
  
  /**
   * 🧹 清除错误状态
   */
  const clearError = () => {
    lastError.value = null
  }
  
  /**
   * 📊 获取用户统计信息
   */
  const getUserStats = async () => {
    if (!isAuthenticated.value) return null
    
    try {
      const response = await fetch('http://127.0.0.1:8002/api/auth/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.data
      }
    } catch (error) {
      console.warn('Failed to get user stats:', error)
    }
    
    return null
  }
  
  // 初始化时恢复认证状态
  restoreAuthData()
  
  return {
    // 状态
    isLinking,
    connectionStartTime,
    user,
    accessToken,
    refreshToken,
    captchaImage,
    captchaId,
    lastError,
    
    // 计算属性
    isAuthenticated,
    connectionDuration,
    
    // 方法
    getCaptcha,
    linkStart,
    register,
    handleOAuthCallback,
    enterGuestMode,
    refreshAccessToken,
    logout,
    saveAuthData,
    restoreAuthData,
    clearError,
    getUserStats
  }
}, {
  persist: {
    key: 'galgame-auth',
    storage: localStorage,
    pick: ['user', 'accessToken', 'refreshToken']
  }
})
