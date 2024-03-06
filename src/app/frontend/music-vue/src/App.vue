<template>
  <div class="app-bg"></div>
  <div class="app-container">
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
          <RecommendationForm @recommend="handleNewRecommendation" />
        </div>
        <div class="recommendations-list-container">
          <RecommendationList :recommendations="recommendations" />
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import placeholderAlbumCover from './assets/50.png';
import Footer from './components/Footer.vue';
import Navbar from './components/Navbar.vue';
import NowPlaying from './components/NowPlaying.vue';
import RecentlyPlayedList from './components/RecentlyPlayedList.vue';
import RecommendationForm from './components/RecommendationForm.vue';
import RecommendationList from './components/RecommendationList.vue';
import { Song } from './types/Song';

export default {
  name: 'App',
  components: {
    Footer,
    Navbar,
    NowPlaying,
    RecentlyPlayedList,
    RecommendationForm,
    RecommendationList
  },
  setup() {
    const recommendations = ref<Song[]>([
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
    ]);

    function handleNewRecommendation(songTitle: string) {
      const newRecommendation: Song = {
        songTitle: songTitle,
        artistName: 'Mock Artist',
        albumName: 'Mock Album',
        albumCoverUrl: placeholderAlbumCover
      };

      recommendations.value.push(newRecommendation);
    }

    return { recommendations, handleNewRecommendation };
  },
};
</script>

<style>
.app-container {
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
  background: linear-gradient(-45deg, #FA573C, #FFFFFF, #42b883, #4FC08D, #FA573C);
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
  .app-container {
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
  .app-container {
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
  .app-container {
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
