import { createSignal } from 'solid-js';
import './index.css';

type RecommendationFormProps = {
    onRecommend: (songTitle: string) => void;
};

const RecommendationForm = (props: RecommendationFormProps) => {
    const [songTitle, setSongTitle] = createSignal('');

    const handleSubmit = (event: Event) => {
        event.preventDefault();
        props.onRecommend(songTitle());
        setSongTitle('');
    };

    return (
        <div class="recommendation-form-modal">
            <h1>Recommend a Song</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={songTitle()}
                    onInput={(e) => setSongTitle(e.currentTarget.value)}
                    placeholder="Find a song on Apple Music..."
                    required
                />
                <button type="submit">Recommend</button>
            </form>
        </div>
    );
};

export default RecommendationForm;
