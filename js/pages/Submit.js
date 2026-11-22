
import { fetchList } from '../content.js';

export default {
    template: `
        <main class="page-submit">
            <div class="submit-container">
                <h1>Submit a Record</h1>
                <p>Fill out the information below to submit a new record.</p>

                <form @submit.prevent="prepareSubmission">

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

                    <label>Player Username</label>
                    <input
                        type="text"
                        v-model="username"
                        placeholder="Your username"
                        required
                    >

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
                        placeholder="360"
                        required
                    >

                    <label class="checkbox-label">
                        <input type="checkbox" v-model="mobile">
                        Mobile Record
                    </label>

                    <button type="submit" :disabled="loading">
                        Prepare Submission
                    </button>
                </form>

                <div v-if="submission" class="submission-result">
                    <h2>Submission Prepared!</h2>
                    <p>Copy the information below and send it to the list staff.</p>

                    <textarea
                        readonly
                        :value="submission"
                    ></textarea>

                    <button type="button" @click="copySubmission">
                        Copy Submission
                    </button>

                    <p v-if="copied">Copied!</p>
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
            username: '',
            percent: null,
            video: '',
            hz: null,
            mobile: false,
            submission: '',
            copied: false,
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
    },

    methods: {
        prepareSubmission() {
            const level = this.levels.find(
                item => item.path === this.selectedLevel
            );

            if (!level) return;

            this.submission = [
                `Level: ${level.name}`,
                `Player: ${this.username}`,
                `Percentage: ${this.percent}%`,
                `Video: ${this.video}`,
                `Refresh Rate: ${this.hz}Hz`,
                `Mobile: ${this.mobile ? 'Yes' : 'No'}`,
            ].join('\n');

            this.copied = false;
        },

        async copySubmission() {
            try {
                await navigator.clipboard.writeText(this.submission);
                this.copied = true;
            } catch (error) {
                console.error('Could not copy submission:', error);
            }
        },
    },
};
