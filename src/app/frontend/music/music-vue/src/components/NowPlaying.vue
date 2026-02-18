<template>
  <div v-if="loading && !nowPlaying" :class="styles.nowPlayingComponent">
    <div :class="styles.albumArtContainer">
      <div :class="[styles.nowPlayingSkeletonImg, styles.skeletonLoader]"></div>
    </div>
    <div :class="styles.nowPlayingComponentTextContainer">
      <h1>Mario's Now Playing</h1>
      <div :class="styles.nowPlayingComponentText">
        <div :class="styles.songTitleContainer">
          <div
            :class="styles.skeletonLoader"
            style="width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0"
          ></div>
          <div
            :class="[styles.nowPlayingSkeletonTitle, styles.skeletonLoader]"
          ></div>
        </div>
        <div
          :class="[styles.nowPlayingSkeletonArtist, styles.skeletonLoader]"
        ></div>
        <div :class="[styles.nowPlayingSkeletonAlbum, styles.skeletonLoader]"></div>
        <div
          :class="[styles.nowPlayingSkeletonTimestamp, styles.skeletonLoader]"
        ></div>
      </div>
    </div>
  </div>

  <div v-else-if="error && !nowPlaying" :class="styles.nowPlayingComponent">
    <img :src="getProcessedArtworkUrl(undefined)" alt="Error Album Art" />
    <div :class="styles.nowPlayingComponentTextContainer">
      <h1>Mario's Now Playing</h1>
      <div :class="styles.nowPlayingComponentText">
        <h2>Unable to load music data</h2>
        <p>{{ error }}</p>
      </div>
    </div>
  </div>

  <div v-else :class="styles.nowPlayingComponent">
    <div :class="styles.albumArtContainer">
      <img
        :src="getProcessedArtworkUrl(nowPlaying?.artworkUrl, '300x300')"
        :alt="`${nowPlaying?.albumName || 'Album'} Art`"
        :style="{ cursor: nowPlaying?.url ? 'pointer' : 'default' }"
        :title="
          nowPlaying?.url ? `Click to open ${nowPlaying.name} in Apple Music` : ''
        "
        @click="handleAlbumArtClick"
      />
    </div>
    <div :class="styles.nowPlayingComponentTextContainer">
      <div :class="styles.nowPlayingHeader">
        <h1>Mario's Now Playing</h1>
      </div>
      <div :class="styles.nowPlayingComponentText">
        <div :class="styles.songTitleContainer">
          <SourceIndicator
            :source="nowPlaying?.source"
            size="small"
            :url="nowPlaying?.url"
          />
          <h2 :title="nowPlaying?.name || 'No song playing'">
            {{ nowPlaying?.name || "No song playing" }}
          </h2>
        </div>
        <p :title="nowPlaying?.artistName || 'Unknown Artist'">
          {{ nowPlaying?.artistName || "Unknown Artist" }}
        </p>
        <p :title="nowPlaying?.albumName || 'Unknown Album'">
          {{ nowPlaying?.albumName || "Unknown Album" }}
        </p>
        <span
          v-if="relativeTime"
          :class="styles.nowPlayingTimestamp"
          :title="`Played: ${playedAtDisplay}`"
        >
          {{ relativeTime }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMusicStore } from "../composables/useMusicStore";
import { formatRelativeTime } from "../utils/formatters";
import { getProcessedArtworkUrl } from "../utils/imageProcessing";
import { openUrlInNewTab } from "../utils/navigation";
import SourceIndicator from "./SourceIndicator.vue";
import styles from "./NowPlaying.module.css";

const musicStore = useMusicStore();

const nowPlaying = computed(() => musicStore.nowPlaying.value);
const loading = computed(() => musicStore.loading.value);
const error = computed(() => musicStore.error.value);

const relativeTime = computed(() => {
  if (!nowPlaying.value?.processedTimestamp) {
    return "";
  }
  return formatRelativeTime(nowPlaying.value.processedTimestamp);
});

const playedAtDisplay = computed(() => {
  if (!nowPlaying.value?.processedTimestamp) {
    return "";
  }
  return new Date(nowPlaying.value.processedTimestamp).toLocaleString();
});

const handleAlbumArtClick = () => {
  openUrlInNewTab(nowPlaying.value?.url);
};
</script>
  