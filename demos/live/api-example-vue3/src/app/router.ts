import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

// The site is single-view: App.vue reads `state` / `apiId` route params and
// renders the matching example card. A no-op component keeps router-view happy.
const routes: RouteRecordRaw[] = [
  {
    path: '/:state?/:apiId?',
    name: 'example',
    component: { render: () => null },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { router };
