import placeholderAlbumCover from '../../assets/300.png';
import { Song } from '../../types/song';
import './index.css';

// Mock data for the currently playing song
const currentSong: Song = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: placeholderAlbumCover
};

const NowPlaying = () => {
    return (
        <div className="now-playing-component styled-container">
            <img src={currentSong.albumCoverUrl} alt="Album Art" />
            <div className="now-playing-component-text-container">
                <h1>Mario's Now Playing</h1>
                <div className="now-playing-component-text">
                    <h2>{currentSong.songTitle}</h2>
                    <p>{currentSong.artistName}</p>
                    <p>{currentSong.albumName}</p>
                </div>
            </div>
        </div>
    );
};

export default NowPlaying;
