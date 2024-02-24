import { component$ } from '@builder.io/qwik';
import { Song } from '../../types/Song.tsx';
import './index.css';

type RecommendationListProps = {
    recommendations: Song[];
};

export default component$((props: RecommendationListProps) => {
    return (
        <div class="recommendation-list-modal">
            <h1>Recommendation Backlog</h1>
            <ul>
                {props.recommendations.map((recommendation, index) => (
                    <li key={index} class="recommendation-item">
                        <img src={recommendation.albumCoverUrl} alt="Album Cover" class="album-cover" />
                        <div class="song-info">
                            <h3>{recommendation.songTitle}</h3>
                            <p>{recommendation.artistName} - {recommendation.albumName}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
});
