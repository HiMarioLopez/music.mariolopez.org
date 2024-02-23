import React, { useState } from 'react';
import './index.css';

type RecommendationFormProps = {
    onRecommend: (songTitle: string) => void;
};


const RecommendationForm: React.FC<RecommendationFormProps> = ({ onRecommend }) => {
    const [songTitle, setSongTitle] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onRecommend(songTitle);
        setSongTitle('');
    };

    return (
        <div className="recommendation-form-modal">
            <h1>Recommend a Song</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Find a song on Apple Music..."
                    required
                />
                <button type="submit">Recommend</button>
            </form>
        </div>
    );
};

export default RecommendationForm;
