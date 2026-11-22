
import { fetchList } from '../content.js';

const API = 'https://level-submission-bot.onrender.com';

export default {
    template: `
        <main class="page-submit">
            <div class="submit-container">
                <h1>Submit a Record</h1>
                <p>Submit your Geometry Dash record using your Discord account.</p>

                <div v-if="$root.store.authLoading">
                    Checking your Discord account...
                </div>

                <div v-else-if="!$root.store.user">
                    <p>You must log in with Discord before submitting a record.</p>
                    <button type="button" @click="$root.store.login()">
                        Login with Discord
                    </button>
                </div>

                <div v-else>
                    <p>
                        Submitting as:
                        <strong>
                            {{ $root.store.user.global_name || $root.store.user.username }}
                        </strong>
                    </p>

                    <section v-if="notifications.length" class="notifications">
                        <h2>Notifications</h2>

                        <div
                            v-for="notification in notifications"
                            :key="notification.id"
                            class="notification"
                        >
                            <p>
                                Your record for
                                <strong>{{ notification.level_name }}</strong>
                                at {{ notification.percent }}% has been accepted!
                            </p>

                            <button
                                type="button"
                                @click="markNotificationRead(notification.id)"
                            >
                                Dismiss
                            </button>
                        </div>
                    </section>

                    <form @submit.prevent="submitSubmission">
                        <label>Search for a level</label>
                        <input
                            type="text"
                            v-model="search"
                            placeholder="Search levels..."
                        >

                        <label>Select Level</label>
                        <select v-model="selectedLevel" required>
                            <option value="" disabled>Select a level</option>
                            <option
                                v-for="level in filteredLevels"
                                :key="level.path"
                                :value="level.path"
                            >
                                {{ level.name }}
                            </option>
                        </select>

                        <p v-if="loading">Loading levels...</p>
                        <p v-else-if="levels.length === 0">
                            No levels could be loaded.
                        </p>
                        <p v-else>
                            {{ filteredLevels.length }} levels found
                        </p>

                        <label>Completion Percentage</label>
                        <input
                            type="number"
                            v-model.number="percent"
                            min="1"
                            max="100"
                            placeholder="100"
                            required
                        >

                        <label>Video Link</label>
                        <input
                            type="url"
                            v-model="video"
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                        >

                        <label>Refresh Rate (Hz)</label>
                        <input
                            type="number"
                            v-model.number="hz"
                            min="1"
                            max="2000"
                            placeholder="360"
                            required
                        >

                        <label class="checkbox-label">
                            <input type="checkbox" v-model="mobile">
                            Mobile Record
                        </label>

                        <p v-if="error" class="error">{{ error }}</p>
                        <p v-if="success" class="success">{{ success }}</p>

                        <button type="submit" :disabled="submitting">
                            {{ submitting ? 'Submitting...' : 'Submit Record' }}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    `,

    data() {
        return {
            levels: [],
            loading: true,
            search: '',
            selectedLevel: '',
            percent: null,
            video: '',
            hz: null,
            mobile: false,
            submitting: false,
            error: '',
            success: '',
            notifications: [],
            notificationTimer: null,
        };
    },

    computed: {
        filteredLevels() {
            const query = this.search.toLowerCase().trim();

            return this.levels.filter(level =>
                level.name.toLowerCase().includes(query)
            );
        },
    },

    async mounted() {
        try {
            const result = await fetchList();

            if (result) {
                this.levels = result
                    .filter(([level]) => level)
                    .map(([level]) => ({
                        name: level.name,
                        path: level.path,
                    }));
            }
        } catch (error) {
            console.error('Failed to load submission levels:', error);
        } finally {
            this.loading = false;
        }

        await this.$root.store.checkAuth();

        if (this.$root.store.user) {
            await this.loadNotifications();

            this.notificationTimer = setInterval(() => {
                this.loadNotifications();
            }, 30000);
        }
    },

    beforeUnmount() {
        if (this.notificationTimer) {
            clearInterval(this.notificationTimer);
        }
    },

    methods: {
        async submitSubmission() {
            this.error = '';
            this.success = '';
            this.submitting = true;

            try {
                const response = await fetch(`${API}/api/submissions`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        levelPath: this.selectedLevel,
                        percent: this.percent,
                        video: this.video.trim(),
                        hz: this.hz,
                        mobile: this.mobile,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Submission failed.');
                }

                this.success = `Record submitted successfully! Submission ID: ${result.id}`;

                this.selectedLevel = '';
                this.percent = null;
                this.video = '';
                this.hz = null;
                this.mobile = false;

            } catch (error) {
                this.error = error.message;
            } finally {
                this.submitting = false;
            }
        },

        async loadNotifications() {
            try {
                const response = await fetch(`${API}/api/notifications`, {
                    credentials: 'include',
                });

                if (!response.ok) return;

                const result = await response.json();
                this.notifications = result.notifications || [];

            } catch (error) {
                console.error('Could not load notifications:', error);
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
                console.error(error);
            }
        },
    },
};
