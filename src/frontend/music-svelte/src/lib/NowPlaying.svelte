<script lang="ts">
    import type { Song } from "../types/Song";

    const currentSong: Song = {
        songTitle: "Song Title",
        artistName: "Artist",
        albumName: "Album",
        albumCoverUrl: "https://via.placeholder.com/300",
    };
</script>

<div class="now-playing-modal">
    <img src={currentSong.albumCoverUrl} alt="Album Art" class="album-art" />
    <div class="content-container">
        <h1 class="header-title">Mario's Now Playing</h1>
        <div class="music-info">
            <h2>{currentSong.songTitle}</h2>
            <p>{currentSong.artistName}</p>
            <p>{currentSong.albumName}</p>
        </div>
    </div>
</div>

<style>
    .now-playing-modal {
        background: rgba(50, 50, 50, 0.6);
        color: aliceblue;
        padding: 20px;
        border-radius: 15px;
        box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.1),
            inset 0 4px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: flex-start;
        max-width: 600px;
    }

    .album-art {
        width: 250px;
        height: 250px;
        border-radius: 10px;
        margin-right: 20px;
    }

    .content-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 250px;
    }

    .header-title {
        margin: 0;
    }

    .music-info {
        text-align: left;
    }

    .music-info h2,
    .music-info p {
        margin: 0;
    }

    @media (max-width: 680px) {
        .now-playing-modal {
            flex-direction: column-reverse;
            width: 80vw;
            max-width: none;
        }

        .album-art {
            width: 80vw;
            height: auto;
            margin: 10px 0;
        }

        .header-title,
        .music-info {
            width: 80vw;
            margin-bottom: 10px;
        }

        .content-container {
            height: auto;
        }
    }
</style>
