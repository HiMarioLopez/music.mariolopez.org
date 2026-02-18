<template>
  <AnimatedBackground :colors="gradientColors" />
  <div :class="styles.app">
    <Navbar />
    <main :class="styles.mainContent">
      <div :class="styles.centerColumn">
        <article
          :class="[styles.nowPlayingContainer, styles.styledContainer]"
          aria-label="Currently playing song"
        >
          <NowPlaying />
        </article>
        <section
          :class="[styles.recentlyPlayedContainer, styles.styledContainer]"
          aria-label="Recently played songs"
        >
          <RecentlyPlayedList />
        </section>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AnimatedBackground from "./components/AnimatedBackground.vue";
import Footer from "./components/Footer.vue";
import Navbar from "./components/Navbar.vue";
import NowPlaying from "./components/NowPlaying.vue";
import RecentlyPlayedList from "./components/RecentlyPlayedList.vue";
import { provideMusicStore } from "./composables/useMusicStore";
import styles from "./styles/App.module.css";

const musicStore = provideMusicStore();
const gradientColors = computed(() => musicStore.gradientColors.value);
</script>
