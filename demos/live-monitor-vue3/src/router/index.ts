import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/live-monitor',
  },
  {
    path: '/live-monitor',
    component: () => import('../views/live-monitor.vue'),
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.fullPath === from.fullPath) {
    // Disable return if current route is the same as previous route
    next(false);
  } else {
    next();
  }
});
export default router;
