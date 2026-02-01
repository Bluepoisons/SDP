import { defineStore } from "pinia";

/**
 * 🧠 Neural Link v11.0 - 身份识别系统
 * 支持完整的JWT认证、验证码、用户管理
 */

interface UserInfo {
  id: string;
  username: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthState {
  // 🔐 认证状态
  isAuthenticated: boolean;
  isLinking: boolean;  // 神经连接中
  
  // 👤 用户信息
  user: UserInfo | null;
  token: string | null;
  loginTime: number | null;
  
  // 🛡️ 验证码状态
  captchaImage: string | null;
  captchaToken: string | null;
  
  // 🚫 错误状态
  lastError: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    isAuthenticated: false,
    isLinking: false,
    user: null,
    token: null,
    loginTime: null,
    captchaImage: null,
    captchaToken: null,
    lastError: null,
  }),
  
  getters: {
    // 获取在线时长（分钟）
    onlineDuration(): number {
      if (!this.loginTime) return 0;
      return Math.floor((Date.now() - this.loginTime) / 60000);
    },
    
    // 获取神经同步率 (模拟值)
    neuralSyncRate(): number {
      if (!this.isAuthenticated) return 0;
      const duration = this.onlineDuration;
      return Math.min(100, 65 + duration * 0.5);
    }
  },
  
  actions: {
    // 🎯 获取验证码
    async getCaptcha() {
      try {
        const response = await fetch('http://127.0.0.1:8001/api/auth/captcha');
        if (!response.ok) throw new Error('Failed to get captcha');
        
        const data = await response.json();
        this.captchaImage = data.image;
        this.captchaToken = data.token;
        this.lastError = null;
        
        return data;
      } catch (error) {
        this.lastError = '验证码获取失败，检查神经连接状态';
        throw error;
      }
    },
    
    // 📝 注册新用户
    async register(username: string, password: string, captcha: string, phone?: string) {
      if (!this.captchaToken) {
        throw new Error('请先获取验证码');
      }
      
      this.isLinking = true;
      this.lastError = null;
      
      try {
        const response = await fetch('http://127.0.0.1:8001/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            phone,
            captcha,
            captcha_token: this.captchaToken
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // 动漫风格错误处理
          const errorMap: Record<string, string> = {
            'USERNAME_TAKEN': '该神经ID已被占用',
            'CAPTCHA_INVALID': '安全验证失败，神经同步率过低',
            'CAPTCHA_EXPIRED': '验证码已过期，请重新获取',
            'VALIDATION_ERROR': '输入数据格式异常'
          };
          
          this.lastError = errorMap[data.code] || data.message || '神经连接建立失败';
          throw new Error(this.lastError);
        }
        
        // 注册成功，保存认证信息
        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        this.loginTime = Date.now();
        
        return data;
      } finally {
        this.isLinking = false;
      }
    },
    
    // 🚀 Link Start - 登录
    async linkStart(username: string, password: string, captcha: string) {
      if (!this.captchaToken) {
        throw new Error('请先获取验证码');
      }
      
      this.isLinking = true;
      this.lastError = null;
      
      try {
        const response = await fetch('http://127.0.0.1:8001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            captcha,
            captcha_token: this.captchaToken
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // 动漫风格错误处理
          const errorMap: Record<string, string> = {
            'NEURAL_SYNC_FAILED': '神经同步失败，用户名或密码错误',
            'USER_NOT_FOUND': '未检测到该神经ID，请先注册',
            'CAPTCHA_INVALID': '安全验证失败，神经同步率过低',
            'CAPTCHA_EXPIRED': '验证码已过期，请重新获取'
          };
          
          this.lastError = errorMap[data.code] || data.message || '神经连接建立失败';
          throw new Error(this.lastError);
        }
        
        // 登录成功，保存认证信息
        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        this.loginTime = Date.now();
        
        return data;
      } finally {
        this.isLinking = false;
      }
    },
    
    // 🔌 断开神经连接
    async disconnect() {
      if (this.token) {
        try {
          await fetch('http://127.0.0.1:8001/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
        } catch (error) {
          console.warn('Logout request failed:', error);
        }
      }
      
      // 清理状态
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
      this.loginTime = null;
      this.lastError = null;
      this.captchaImage = null;
      this.captchaToken = null;
    },
    
    // 🔄 检查并恢复会话
    async checkSession() {
      if (!this.token) return false;
      
      try {
        const response = await fetch('http://127.0.0.1:8001/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (!response.ok) {
          // Token 无效，清理状态
          await this.disconnect();
          return false;
        }
        
        const data = await response.json();
        this.user = data;
        this.isAuthenticated = true;
        
        return true;
      } catch (error) {
        console.warn('Session check failed:', error);
        await this.disconnect();
        return false;
      }
    }
  },
  
  persist: {
    key: "neural-link-v11",
    paths: ["token", "user", "loginTime"] // 只持久化必要信息
  },
});
