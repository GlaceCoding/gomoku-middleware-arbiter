import DashboardView from '@/components/DashboardView.vue'
import GameView from '@/components/GameView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/game/:id', component: GameView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
