<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-center mb-8">Register</h2>
            <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
            </div>
            <form @submit.prevent="handleRegister" class="space-y-6">
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
                <label class="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                <input 
                v-model="form.email"
                type="email"
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
                {{ loading ? 'Registering...' : 'Register' }}
            </button>
            </form>
            <p class="mt-4 text-center">
            Already have an account?
            <router-link to="/" class="text-blue-500 hover:text-blue-700">Login</router-link>
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
            email: '',
            password: ''
            },
            error: null,
            loading: false
        };
        },
        methods: {
        async handleRegister() {
            this.error = null;
            this.loading = true;
            
            try {
            const response = await api.post('/auth/register', this.form);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.$router.push('/');
            } catch (error) {
            this.error = error.response?.data?.error || 'An error occurred during registration';
            } finally {
            this.loading = false;
            }
        }
        }
    };
</script>