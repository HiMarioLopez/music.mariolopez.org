'use client';

import React, { useState } from 'react';
import styles from './style.module.css';

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
        <div className={styles.recommendationFormModal}>
            <h1>Recommend a Song</h1>
            <form onSubmit={handleSubmit} className={styles.recommendationFormModalForm}>
                <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Find a song on Apple Music..."
                    required
                    className={styles.recommendationFormModalInputText}
                />
                <button type="submit" className={styles.recommendationFormModalButton}>Recommend</button>
            </form>
        </div>
    );
};

export default RecommendationForm;
