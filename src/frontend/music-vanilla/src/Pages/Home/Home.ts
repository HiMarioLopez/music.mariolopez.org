import placeholderAlbumCover from '../../Assets/Images/50.png';
import { Footer } from "../../Components/Footer/Footer";
import { Navbar } from "../../Components/Navbar/Navbar";
import { NowPlaying } from "../../Components/NowPlaying/NowPlaying";
import { RecentlyPlayedList } from "../../Components/RecentlyPlayedList/RecentlyPlayedList";
import { RecommendationForm } from "../../Components/RecommendationForm/RecommendationForm";
import { RecommendationList } from "../../Components/RecommendationList/RecommendationList";
import { AppleMusicTester } from "../../Components/AppleMusicTester/AppleMusicTester";
import { Song } from "../../Types/Song.type";
import './home.css';

// Mock data for recommendations
let recommendations: Song[] = [
    {
        songTitle: 'Song One',
        artistName: 'Artist One',
        albumName: 'Album One',
        albumCoverUrl: placeholderAlbumCover
    },
    {
        songTitle: 'Song Two',
        artistName: 'Artist Two',
        albumName: 'Album Two',
        albumCoverUrl: placeholderAlbumCover
    },
];

function Home(): HTMLElement {
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

    const recentlyPlayedListContainer = document.createElement('div');
    recentlyPlayedListContainer.className = 'recently-played-list-container';
    leftColumn.appendChild(RecentlyPlayedList());
    leftColumn.appendChild(recentlyPlayedListContainer);

    leftColumn.appendChild(AppleMusicTester());
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
                albumCoverUrl: placeholderAlbumCover
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

    // Append Footer
    const footer = Footer();
    app.appendChild(footer);

    return app;
}


export default Home;
