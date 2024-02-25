import { Song } from '../Types/Song.type';
import '../Assets/Styles/RecommendationList.styles.css';

// Assuming an interface for the props similar to what's used in the React version
interface RecommendationListProps {
    recommendations: Song[];
}

export function RecommendationList(props: RecommendationListProps): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'recommendation-list-modal';

    const title = document.createElement('h1');
    title.textContent = 'Recommendation Backlog';
    modal.appendChild(title);

    const ul = document.createElement('ul');
    props.recommendations.forEach((recommendation) => {
        const li = document.createElement('li');
        li.className = 'recommendation-item';

        const img = document.createElement('img');
        img.src = recommendation.albumCoverUrl;
        img.alt = 'Album Cover';
        img.className = 'album-cover';
        li.appendChild(img);

        const songInfo = document.createElement('div');
        songInfo.className = 'song-info';

        const songTitle = document.createElement('h3');
        songTitle.textContent = recommendation.songTitle;
        songInfo.appendChild(songTitle);

        const artistAlbum = document.createElement('p');
        artistAlbum.textContent = `${recommendation.artistName} - ${recommendation.albumName}`;
        songInfo.appendChild(artistAlbum);

        li.appendChild(songInfo);
        ul.appendChild(li);
    });

    modal.appendChild(ul);

    return modal;
}
