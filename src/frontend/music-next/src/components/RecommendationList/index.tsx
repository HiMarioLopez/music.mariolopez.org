import React from 'react';
import Image from 'next/image';
import styles from './style.module.css';
import { Song } from '@/types/Song';

type RecommendationListProps = {
    recommendations: Song[];
};

const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
    return (
        <div className={`styledContainer ${styles.recommendationListComponent}`}>
            <h1>Recommendation Backlog</h1>
            <ul>
                {recommendations.map((recommendation, index) => (
                    <li key={index}>
                        <Image src={recommendation.albumCoverUrl} alt="Album Cover" width={50} height={50} unoptimized />
                        <div className={styles.recommendationListComponentTrackTextContainer}>
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
