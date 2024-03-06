<script lang="ts">
  import placeholderAlbumCover from "./assets/50.png";
  import Footer from "./lib/Footer.svelte";
  import Navbar from "./lib/Navbar.svelte";
  import NowPlaying from "./lib/NowPlaying.svelte";
  import RecentlyPlayedList from "./lib/RecentlyPlayedList.svelte";
  import RecommendationForm from "./lib/RecommendationForm.svelte";
  import RecommendationList from "./lib/RecommendationList.svelte";
  import type { Song } from "./types/Song";

  let recommendations: Song[] = [
    {
      songTitle: "Song One",
      artistName: "Artist One",
      albumName: "Album One",
      albumCoverUrl: placeholderAlbumCover,
    },
    {
      songTitle: "Song Two",
      artistName: "Artist Two",
      albumName: "Album Two",
      albumCoverUrl: placeholderAlbumCover,
    },
  ];

  function handleNewRecommendation(title: string) {
    const newRecommendation: Song = {
      songTitle: title,
      artistName: "Mock Artist",
      albumName: "Mock Album",
      albumCoverUrl: placeholderAlbumCover,
    };
    recommendations = [...recommendations, newRecommendation];
  }
</script>

<div class="app-bg" />
<div class="app">
  <Navbar />
  <div class="main-content">
    <div class="left-column">
      <div class="now-playing-container">
        <NowPlaying />
      </div>
      <RecentlyPlayedList />
    </div>
    <div class="right-column">
      <div class="recommendation-form-container">
        <RecommendationForm onRecommend={handleNewRecommendation} />
      </div>
      <div class="recommendations-list-container">
        <RecommendationList {recommendations} />
      </div>
    </div>
  </div>
  <Footer />
</div>

<style>
  .app {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }

    50% {
      background-position: 100% 50%;
    }

    100% {
      background-position: 0% 50%;
    }
  }

  .app-bg {
    position: fixed;
    animation: gradient 5s ease infinite;
    background: linear-gradient(
      -45deg,
      #ff3e00,
      #fa573c,
      #ffffff,
      #fa573c,
      #ff3e00
    );
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 400% 400%;
    height: 100vh;
    width: 100vw;
    z-index: -1;
  }

  @media (min-width: 1300px) {
    .main-content {
      max-width: 1200px;
      display: flex;
    }

    .left-column,
    .right-column {
      width: 50%;
    }

    .left-column {
      margin-right: var(--margin-large);
    }

    .now-playing-container,
    .recommendation-form-container,
    .recommendations-list-container {
      margin-bottom: var(--margin-large);
    }

    .recommendations-list-container:last-child {
      margin-bottom: 0;
    }
  }

  @media (max-height: 1000px) {
    .app {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
  }

  @media (min-width: 1300px) and (max-height: 1000px),
    (max-width: 1299px) and (max-height: 1000px) {
    .main-content {
      padding-top: calc(var(--navbar-height-desktop) + 40px);
      padding-bottom: 0;
    }
  }

  @media (max-width: 1299px) {
    .app {
      flex-direction: column;
    }

    .now-playing-container,
    .recommendation-form-container,
    .recommendations-list-container {
      width: 100%;
      margin: var(--margin-large) 0;
    }

    .main-content {
      padding-top: calc(var(--navbar-height-desktop) + var(--padding-large));
      padding-bottom: 0;
    }
  }

  @media (max-width: 680px) {
    .app {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    .main-content {
      padding-top: calc(var(--navbar-height-mobile) + var(--padding-large));
      padding-bottom: 0;
    }
  }
</style>
