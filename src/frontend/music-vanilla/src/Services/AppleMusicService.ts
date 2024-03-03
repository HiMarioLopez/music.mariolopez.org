class AppleMusicService {
    private static instance: AppleMusicService;

    public static getInstance(): AppleMusicService {
        if (!AppleMusicService.instance) {
            AppleMusicService.instance = new AppleMusicService();
        }
        return AppleMusicService.instance;
    }

    public async fetchSearchHints(search_term: string, search_limit: number = 5) {
        // Use window.MusicKit.getInstance() directly within this method
        // as the MusicKit instance management is separate from your service's singleton pattern
        console.log(`[🍎 AppleMusicService] ⌛ Fetching Search Hints for term: ${search_term}...`);

        const clientInstance = window.MusicKit.getInstance();

        try {
            const queryUrl = 'v1/catalog/{{storefrontId}}/search/hints';
            const queryParameters = { term: search_term, limit: search_limit, l: 'en-us' };

            // Correct usage according to MusicKit's method for fetching hints or search
            const results = await clientInstance.api.music(queryUrl, queryParameters);

            console.log(`[🍎 AppleMusicService] ✅ Retreival of Search Hints successful!`);
            return results;
        } catch (error) {
            console.log(`[🍎 AppleMusicService] ❌ Error fetching Search Hints for term: ${search_term}...`);
            console.error(error);
            throw error; // It's generally better to throw errors for the caller to handle
        }
    }

    public async fetchSearchSuggestions(search_term: string, search_limit: number = 5): Promise<Suggestion[]> {
        // Use window.MusicKit.getInstance() directly within this method
        // as the MusicKit instance management is separate from your service's singleton pattern
        console.log(`[🍎 AppleMusicService] ⌛ Fetching Search Suggestions for term: ${search_term}...`);

        const clientInstance = window.MusicKit.getInstance();

        try {
            const queryUrl = 'v1/catalog/{{storefrontId}}/search/suggestions';
            const queryParameters = {
                term: search_term,
                limit: search_limit,
                l: 'en-us',
                kinds: 'topResults',
                types: 'songs'
            };
            // Correct usage according to MusicKit's method for fetching hints or search
            const response: ApiResponse = await clientInstance.api.music(queryUrl, queryParameters);

            if (response.data && response.data.results && response.data.results.suggestions) {
                console.log(`[🍎 AppleMusicService] ✅ Retrieval of Search Suggestions successful!`);
                // Now it's safe to access results.results.suggestions
                return response.data.results.suggestions; // Directly return the suggestions
            }
            else {
                throw new TypeError('Unexpected response structure');
            }

        } catch (error) {
            console.log(`[🍎 AppleMusicService] ❌ Error fetching Search Suggestions for term: ${search_term}...`);
            console.error(error);
            throw error; // It's generally better to throw errors for the caller to handle
        }
    }
}

export default AppleMusicService;

// Usage
// const appleMusicService = AppleMusicService.getInstance();
// appleMusicService.fetchSearchHints('beach bunny').then(data => {
//     console.log(data);
// });
