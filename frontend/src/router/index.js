import { createRouter, createWebHashHistory } from 'vue-router'
import WizardView from '../views/WizardView.vue'
import PlayView from '../views/PlayView.vue'

const routes = [
  { path: '/', component: WizardView },
  { path: '/play', component: PlayView },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
