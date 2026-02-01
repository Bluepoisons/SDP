import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'

/**
 * 🛤️ 路由配置
 * 主要处理 OAuth 回调和应用导航
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: App
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: App,
    meta: { isOAuthCallback: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router