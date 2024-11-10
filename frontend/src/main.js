import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Login from './Login.vue';
import Register from './Register.vue';
import App from './App.vue';
import AdminDashboard from './Dashboard.vue';
import UserDashboard from './UserDashboard.vue';
import './assets/main.css';

const routes = [
  {
    path: '/',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin/dashboard',
    component: AdminDashboard,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/user/dashboard',
    component: UserDashboard,
    meta: { 
      requiresAuth: true,
      requiresUser: true
    }
  },
  {
    path: '/dashboard',
    redirect: to => {
      const userRole = localStorage.getItem('userRole');
      return userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    },
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (to.meta.requiresAuth && !token) {
    next('/');
    return;
  }

  if (to.meta.requiresAdmin && userRole !== 'admin') {
    next('/user/dashboard');
    return;
  }

  if (to.meta.requiresUser && userRole === 'admin') {
    next('/admin/dashboard');
    return;
  }

  next();
});

const app = createApp(App);
app.use(router);
app.mount('#app');

export default router;