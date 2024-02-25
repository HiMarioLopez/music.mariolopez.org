import { Navbar } from "./Navbar.component";
import { NowPlaying } from "./NowPlaying.component";
import { RecentlyPlayedList } from "./RecentlyPlayedList.component";
import { RecommendationForm } from "./RecommendationForm.component";
import { RecommendationList } from "./RecommendationList.component";
import { Song } from "../Types/Song.type";
import '../Assets/Styles/App.styles.css';

// Mock data for recommendations
let recommendations: Song[] = [
    {
        songTitle: 'Song One',
        artistName: 'Artist One',
        albumName: 'Album One',
        albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
        songTitle: 'Song Two',
        artistName: 'Artist Two',
        albumName: 'Album Two',
        albumCoverUrl: 'https://via.placeholder.com/50',
    },
];

function App(): HTMLElement {
    const app = document.createElement('div');
    app.className = 'app';

    // Background gradient
    const appBg = document.createElement('div');
    appBg.className = 'app-bg';
    app.appendChild(appBg);

    // Append Navbar at the top level of the app
    const navbar = Navbar();
    app.appendChild(navbar);

    // Main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Left column
    const leftColumn = document.createElement('div');
    leftColumn.className = 'left-column';

    const nowPlayingContainer = document.createElement('div');
    nowPlayingContainer.className = 'now-playing-container';
    nowPlayingContainer.appendChild(NowPlaying());
    leftColumn.appendChild(nowPlayingContainer);

    leftColumn.appendChild(RecentlyPlayedList());
    mainContent.appendChild(leftColumn);

    // Right column
    const rightColumn = document.createElement('div');
    rightColumn.className = 'right-column';

    const recommendationFormContainer = document.createElement('div');
    recommendationFormContainer.className = 'recommendation-form-container';
    recommendationFormContainer.appendChild(RecommendationForm({
        onRecommend: (songTitle: string) => {
            const newRecommendation: Song = {
                songTitle: songTitle,
                artistName: 'Mock Artist',
                albumName: 'Mock Album',
                albumCoverUrl: 'https://via.placeholder.com/50',
            };
            recommendations.push(newRecommendation);
            updateRecommendationList();
        }
    }));
    rightColumn.appendChild(recommendationFormContainer);

    const recommendationsListContainer = document.createElement('div');
    recommendationsListContainer.className = 'recommendations-list-container';
    let recommendationList = RecommendationList({ recommendations });
    recommendationsListContainer.appendChild(recommendationList);
    rightColumn.appendChild(recommendationsListContainer);

    mainContent.appendChild(rightColumn);

    app.appendChild(mainContent);

    // Function to update RecommendationList
    function updateRecommendationList() {
        recommendationsListContainer.removeChild(recommendationList);
        recommendationList = RecommendationList({ recommendations });
        recommendationsListContainer.appendChild(recommendationList);
    }

    return app;
}


export default App;
