import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home/Home.vue'),
  },
  {
    path: '/login/:sceneId?',
    name: 'Login',
    component: () => import('../pages/Login/Login.vue'),
  },
  {
    path: '/stages/:sceneId?',
    name: 'Stages',
    props: true,
    component: () => import('../pages/Stages/Stages.vue'),
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;


