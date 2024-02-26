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

const RecommendationList = ({ recommendations }: RecommendationListProps) => {
    return (
        <div className="recommendation-list-modal">
            <h1>Recommendation Backlog</h1>
            <ul>
                {recommendations.map((recommendation, index) => (
                    <li key={index} className="recommendation-item">
                        <img src={recommendation.albumCoverUrl} alt="Album Cover" className="album-cover" />
                        <div className="song-info">
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
