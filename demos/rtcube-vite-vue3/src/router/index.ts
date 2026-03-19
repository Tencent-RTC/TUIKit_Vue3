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
    component: Home
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

export default router;
