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
    path: '/stages',
    name: 'Stages',
    redirect: { name: 'chat' },
    component: () => import('../pages/Stages/Stages-Github.vue'),
    children: [
      {
        path: '/stages/chat',
        name: 'chat',
        component: () => import('../scenes/Chat/Chat.vue'),
      },
      {
        path: '/stages/call',
        name: 'call',
        component: () => import('../scenes/Call/Call.vue'),
      },
      {
        path: '/stages/live',
        name: 'live',
        component: () => import('../scenes/Live/Live.vue'),
      },
      {
        path: '/stages/live-list',
        name: 'live-list',
        component: () => import('../scenes/Live/LiveList'),
      },
      {
        path: '/stages/live-player',
        name: 'live-player',
        component: () => import('../scenes/Live/LivePlayer'),
      },
      {
        path: '/stages/live-pusher',
        name: 'live-pusher',
        component: () => import('../scenes/Live/LivePusher'),
      },
    ]
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;


