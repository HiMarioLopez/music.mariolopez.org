import { $, component$, useStore } from '@builder.io/qwik';
import placeholderAlbumCover from '../../assets/50.png';
import { Song } from '../../types/Song';
import './index.css';

type RecommendationFormProps = {
    onAddRecommendation: (song: Song) => void;
};

export default component$((props: RecommendationFormProps) => {
    const state = useStore({ songTitle: '' });

    const handleSubmit = $(async () => {
        props.onAddRecommendation({
            songTitle: state.songTitle,
            artistName: 'Mock Artist',
            albumName: 'Mock Album',
            albumCoverUrl: placeholderAlbumCover
        });

        state.songTitle = '';
    });

    return (
        <div class="recommendation-form-component styled-container">
            <h1>Recommend a Song</h1>
            <form preventdefault:submit onSubmit$={handleSubmit}>
                <input
                    type="text"
                    value={state.songTitle}
                    onInput$={(event) => {
                        const target = event.target as HTMLInputElement; // Ensure correct type
                        state.songTitle = target.value; // Update state based on input
                    }}
                    placeholder="Find a song on Apple Music..."
                    required
                />
                <button type="submit">Recommend</button>
            </form>
        </div>
    );
});
