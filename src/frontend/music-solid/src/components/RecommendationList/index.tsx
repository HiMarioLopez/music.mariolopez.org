import { For } from 'solid-js';
import './index.css';

type Recommendation = {
    songTitle: string;
    albumName: string;
    artistName: string;
    albumCoverUrl: string;
};

type RecommendationListProps = {
    recommendations: Recommendation[];
};

const RecommendationList = (props: RecommendationListProps) => {
    return (
        <div class="recommendation-list-modal">
            <h1>Recommendation Backlog</h1>
            <ul>
                <For each={props.recommendations}>{(recommendation) => (
                    <li class="recommendation-item">
                        <img src={recommendation.albumCoverUrl} alt="Album Cover" class="album-cover" />
                        <div class="song-info">
                            <h3>{recommendation.songTitle}</h3>
                            <p>{recommendation.artistName} - {recommendation.albumName}</p>
                        </div>
                    </li>
                )}</For>
            </ul>
        </div>
    );
};

export default RecommendationList;
