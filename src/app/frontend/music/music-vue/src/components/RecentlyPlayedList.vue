<template>
  <div :class="styles.recentlyPlayedListComponent">
    <h1>Recently Played</h1>
    <SkeletonLoader v-if="loading && recentlyPlayed.length === 0" />
    <p v-else-if="error && recentlyPlayed.length === 0">
      Error loading songs: {{ error }}
    </p>
    <template v-else-if="recentlyPlayed.length > 0">
      <CarouselRow
        :songs="distributedSongs.topRowSongs"
        :settings="topSliderSettings"
        row-name="top"
      />
      <CarouselRow
        :songs="distributedSongs.middleRowSongs"
        :settings="middleSliderSettings"
        row-name="middle"
      />
      <CarouselRow
        :songs="distributedSongs.bottomRowSongs"
        :settings="bottomSliderSettings"
        row-name="bottom"
      />
    </template>
    <p v-else>No recently played songs available</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCarouselSettings } from "../composables/useCarouselSettings";
import { useMusicStore } from "../composables/useMusicStore";
import { useSongDistribution } from "../composables/useSongDistribution";
import styles from "./recently-played/RecentlyPlayedList.module.css";
import CarouselRow from "./recently-played/CarouselRow.vue";
import SkeletonLoader from "./recently-played/SkeletonLoader.vue";

const musicStore = useMusicStore();
const recentlyPlayed = computed(() => musicStore.recentlyPlayed.value);
const loading = computed(() => musicStore.loading.value);
const error = computed(() => musicStore.error.value);
const { topSliderSettings, middleSliderSettings, bottomSliderSettings } =
  useCarouselSettings();
const distributedSongs = useSongDistribution(recentlyPlayed);
</script>
  