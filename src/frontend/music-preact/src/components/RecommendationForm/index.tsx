import { useState } from 'preact/hooks';
import './index.css';

type RecommendationFormProps = {
    onRecommend: (songTitle: string) => void;
};

const RecommendationForm = ({ onRecommend }: RecommendationFormProps) => {
    const [songTitle, setSongTitle] = useState('');

    const handleSubmit = (event: Event) => {
        event.preventDefault();
        onRecommend(songTitle);
        setSongTitle('');
    };

    return (
        <div className="recommendation-form-modal">
            <h1>Recommend a Song</h1>
            <form onSubmit={handleSubmit as any}>
                <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle((e.target as HTMLInputElement).value)}
                    placeholder="Find a song on Apple Music..."
                    required
                />
                <button type="submit">Recommend</button>
            </form>
        </div>
    );
};

export default RecommendationForm;
