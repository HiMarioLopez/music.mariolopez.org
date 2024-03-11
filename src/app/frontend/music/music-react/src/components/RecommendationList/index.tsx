import React from 'react';
import { Song } from '../../types/Song';
import './index.css';

type RecommendationListProps = {
    recommendations: Song[];
};

const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
    return (
        <div className="recommendation-list-component styled-container">
            <h1>Recommendation Backlog</h1>
            <ul>
                {recommendations.map((recommendation, index) => (
                    <li key={index}>
                        <img src={recommendation.albumCoverUrl} alt="Album Cover" />
                        <div className="recommendation-list-component-track-text-container">
                            <h3>{recommendation.songTitle}</h3>
                            <p>{recommendation.artistName} - {recommendation.albumName}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecommendationList;
