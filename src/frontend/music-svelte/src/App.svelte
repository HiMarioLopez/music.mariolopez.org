<script lang="ts">
  import NowPlaying from "./lib/NowPlaying.svelte";
  import RecentlyPlayedList from "./lib/RecentlyPlayedList.svelte";
  import RecommendationForm from "./lib/RecommendationForm.svelte";
  import RecommendationList from "./lib/RecommendationList.svelte";
  import Navbar from "./lib/Navbar.svelte";
  import type { Song } from "./types/Song";

  let recommendations: Song[] = [
    {
      songTitle: "Song One",
      artistName: "Artist One",
      albumName: "Album One",
      albumCoverUrl: "https://via.placeholder.com/50",
    },
    {
      songTitle: "Song Two",
      artistName: "Artist Two",
      albumName: "Album Two",
      albumCoverUrl: "https://via.placeholder.com/50",
    },
  ];

  function handleNewRecommendation(title: string) {
    const newRecommendation: Song = {
      songTitle: title,
      artistName: "Mock Artist",
      albumName: "Mock Album",
      albumCoverUrl: "https://via.placeholder.com/50",
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
</div>

<style>
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

  .app {
    position: absolute;
    width: 100%;
    height: 100%;
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
  }

  @media (min-width: 1300px) {
    .app {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .main-content {
      max-width: 1200px;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      margin: 20px;
    }

    .left-column,
    .right-column {
      width: calc(50% - 20px);
      margin: 0 20px;
    }

    .now-playing-container,
    .recommendation-form-container,
    .recommendations-list-container {
      width: 100%;
      margin-bottom: 20px;
    }

    .recommendations-list-container:last-child {
      margin-bottom: 0;
    }
  }

  @media (max-width: 1299px) {
    .app {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .now-playing-container,
    .recommendation-form-container,
    .recommendations-list-container {
      width: 100%;
      margin: 20px 0;
    }

    .main-content {
      padding-top: 60px;
    }
  }

  @media (max-width: 680px) {
    .main-content {
      padding-top: 50px;
    }

    .app,
    .main-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
  }
</style>
