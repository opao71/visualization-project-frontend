import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import SummitStory from '@/pages/SummitStory.vue'
import SummitStoryOptimized from '@/pages/SummitStoryOptimized.vue'

const routes = [
  {
    path: '/',
    redirect: '/summit'
  },
  {
    path: '/dashboard',
    name: 'DashboardPage',
    component: Dashboard
  },
  {
    path: '/summit',
    name: 'SummitStory',
    component: SummitStoryOptimized  // 使用优化版
  },
  {
    path: '/summit-original',
    name: 'SummitStoryOriginal',
    component: SummitStory  // 保留原版用于对比
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
