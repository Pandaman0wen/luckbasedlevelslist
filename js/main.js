
import routes from './routes.js';

const API = 'https://level-submission-bot.onrender.com';

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,

    user: null,
    authLoading: true,

    notifications: [],
    notificationPanelOpen: false,
    notificationTimer: null,

    get unreadCount() {
        return this.notifications.length;
    },

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
            this.notifications = [];

            if (this.notificationTimer) {
                clearInterval(this.notificationTimer);
                this.notificationTimer = null;
            }
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

            if (this.user) {
                await this.loadNotifications();
            } else {
                this.notifications = [];
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.user = null;
            this.notifications = [];
        } finally {
            this.authLoading = false;
        }
    },

    async loadNotifications() {
        if (!this.user) return;

        try {
            const response = await fetch(`${API}/api/notifications`, {
                credentials: 'include',
            });

            if (!response.ok) return;

            const data = await response.json();
            this.notifications = data.notifications || [];
        } catch (error) {
            console.error('Notification check failed:', error);
        }
    },

    async markNotificationRead(id) {
        try {
            const response = await fetch(
                `${API}/api/notifications/${id}/read`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error('Could not dismiss notification.');
            }

            this.notifications = this.notifications.filter(
                notification => notification.id !== id
            );
        } catch (error) {
            console.error('Could not dismiss notification:', error);
        }
    },

    toggleNotifications() {
        this.notificationPanelOpen = !this.notificationPanelOpen;

        if (this.notificationPanelOpen) {
            this.loadNotifications();
        }
    },
});

const app = Vue.createApp({
    data: () => ({ store }),

    async mounted() {
        await store.checkAuth();

        if (store.user && !store.notificationTimer) {
            store.notificationTimer = setInterval(() => {
                store.loadNotifications();
            }, 30000);
        }
    },

    beforeUnmount() {
        if (store.notificationTimer) {
            clearInterval(store.notificationTimer);
            store.notificationTimer = null;
        }
    },
});

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);
app.mount('#app');
