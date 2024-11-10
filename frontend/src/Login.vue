<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-center mb-8">Login</h2>
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
        </div>
        <form @submit.prevent="handleLogin" class="space-y-6">
            <div>
            <label class="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input 
                v-model="form.username"
                type="text"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
            >
            </div>
            <div>
            <label class="block text-gray-700 text-sm font-bold mb-2">Password:</label>
            <input 
                v-model="form.password"
                type="password"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
            >
            </div>
            <button 
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
            {{ loading ? 'Logging in...' : 'Login' }}
            </button>
        </form>
        <p class="mt-4 text-center">
            Don't have an account?
            <router-link to="/register" class="text-blue-500 hover:text-blue-700">Register</router-link>
        </p>
        </div>
    </div>
</template>

<script>
import api from '@/utils/axios';

export default {
    data() {
        return {
            form: {
                username: '',
                password: ''
            },
            error: null,
            loading: false
        };
    },
    methods: {
        async handleLogin() {
        this.error = null;
        this.loading = true;
        
        try {
            const response = await api.post('/auth/login', this.form);
            const { token, user } = response.data;
            
            // Store token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({
                ...user,
                userId: user.userId  // Make sure userId is included
            }));
            localStorage.setItem('userRole', user.role);
            
            // Redirect based on role
            if (user.role === 'admin') {
                this.$router.push('/admin/dashboard');
            } else {
                this.$router.push('/user/dashboard');
            }
        } catch (error) {
            this.error = error.response?.data?.error || 'An error occurred during login';
        } finally {
            this.loading = false;
        }
    }
    }
};
</script>