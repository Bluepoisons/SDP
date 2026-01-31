import { defineStore } from "pinia";

/**
 * 🔐 认证状态管理
 * 管理用户登录状态和身份信息
 */

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  loginTime: number | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    isAuthenticated: false,
    username: null,
    loginTime: null,
  }),
  
  actions: {
    // 🚀 Link Start - 登录
    linkStart(username: string) {
      this.isAuthenticated = true;
      this.username = username;
      this.loginTime = Date.now();
    },
    
    // 🔌 Logout - 断开连接
    disconnect() {
      this.isAuthenticated = false;
      this.username = null;
      this.loginTime = null;
    },
    
    // 🔄 检查并恢复会话
    checkSession() {
      // 如果有持久化的登录状态，直接恢复
      if (this.isAuthenticated && this.username) {
        return true;
      }
      return false;
    },
    
    // 获取在线时长（分钟）
    getOnlineDuration() {
      if (!this.loginTime) return 0;
      return Math.floor((Date.now() - this.loginTime) / 60000);
    },
  },
  
  persist: {
    key: "sdp-auth",
  },
});
