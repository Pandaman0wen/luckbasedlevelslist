
import routes from './routes.js';

const API = 'https://level-submission-bot.onrender.com';

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,

    user: null,
    authLoading: true,

    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },

    login() {
        window.location.href = `${API}/auth/discord`;
    },

    async logout() {
        try {
            await fetch(`${API}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            this.user = null;
        } catch (error) {
            console.error('Logout failed:', error);
        }
    },

    async checkAuth() {
        try {
            const response = await fetch(`${API}/auth/me`, {
                credentials: 'include',
            });

            const data = await response.json();

            this.user = data.authenticated ? data.user : null;
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.user = null;
        } finally {
            this.authLoading = false;
        }
    },
});

const app = Vue.createApp({
    data: () => ({ store }),

    mounted() {
        store.checkAuth();
    },
});

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);
app.mount('#app');
