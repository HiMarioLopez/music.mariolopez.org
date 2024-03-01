import { For } from 'solid-js';
import { Song } from '../../types/Song';
import './index.css';

type RecommendationListProps = {
    recommendations: Song[];
};

const RecommendationList = (props: RecommendationListProps) => {
    return (
        <div class="recommendation-list-component styled-container">
            <h1>Recommendation Backlog</h1>
            <ul>
                <For each={props.recommendations}>{(recommendation) => (
                    <li>
                        <img src={recommendation.albumCoverUrl} alt="Album Cover" />
                        <div class="recommendation-list-component-track-text-container">
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
