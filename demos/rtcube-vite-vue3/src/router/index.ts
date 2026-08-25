import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

// Only keep Home and Detail routes
const Home = () => import('../views/Home/index.vue');
const Detail = () => import('../views/Detail/index.vue');
const Login = () => import('../views/Login/Login.vue');

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  {
    path: '/home',
    name: 'home',
    component: Home,
    meta: {
      // ✅ 标记预获取 Detail 页面
      prefetch: ['/detail'],
    },
  },
  {
    path: '/detail',
    name: 'detail',
    component: Detail
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

router.afterEach((to) => {
  const prefetchPaths = to.meta?.prefetch;
  if (prefetchPaths && Array.isArray(prefetchPaths)) {
    // Use requestIdleCallback to prefetch during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        (prefetchPaths as string[]).forEach((path: string) => {
          const route = routes.find(r => r.path === path);
          if (route?.component && typeof route.component === 'function') {
            (route.component as () => Promise<any>)();
          }
        });
      });
    }
  }
});

export default router;
