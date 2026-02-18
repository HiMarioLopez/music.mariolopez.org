<template>
  <div
    v-if="songs.length > 0"
    :class="styles.recentlyPlayedListRow"
    :aria-label="`${rowName} carousel of recently played songs`"
    aria-live="polite"
    role="region"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div :class="styles.carouselContainer">
      <div
        ref="trackRef"
        :class="[
          styles.carouselTrack,
          settings.direction === 'right'
            ? styles.carouselTrackRight
            : styles.carouselTrackLeft,
          isHovered ? styles.carouselTrackPaused : '',
        ]"
      >
        <div
          v-for="(song, index) in duplicatedSongs"
          :key="`${rowName}-${song.id}-${index}`"
          :class="styles.carouselItem"
          data-carousel-item
        >
          <SongItem :song="song" :index="index" :row-name="rowName" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import type { AppleMusicSong } from "../../models/AppleMusicSong";
import type { CarouselSettings } from "../../composables/useCarouselSettings";
import SongItem from "./SongItem.vue";
import styles from "./CarouselRow.module.css";

interface Props {
  songs: AppleMusicSong[];
  settings: CarouselSettings;
  rowName: string;
}

const props = defineProps<Props>();

const trackRef = ref<HTMLDivElement | null>(null);
const isHovered = ref(false);
const contentWidth = ref(0);
const measureTimeoutId = ref<number | null>(null);

const duplicatedSongs = computed(() => {
  return [...props.songs, ...props.songs, ...props.songs];
});

const updateContentWidth = () => {
  if (!trackRef.value) {
    return;
  }

  const items = trackRef.value.querySelectorAll("[data-carousel-item]");
  if (items.length === 0) {
    contentWidth.value = 0;
    return;
  }

  let totalWidth = 0;
  const thirdLength = items.length / 3;
  for (let index = 0; index < thirdLength; index += 1) {
    totalWidth += (items[index] as HTMLElement).offsetWidth;
  }
  contentWidth.value = totalWidth;
};

onMounted(() => {
  measureTimeoutId.value = window.setTimeout(() => {
    void nextTick(updateContentWidth);
  }, 100);

  window.addEventListener("resize", updateContentWidth);
});

onUnmounted(() => {
  if (measureTimeoutId.value !== null) {
    window.clearTimeout(measureTimeoutId.value);
    measureTimeoutId.value = null;
  }
  window.removeEventListener("resize", updateContentWidth);
});

watch(
  () => props.songs,
  async () => {
    await nextTick();
    if (measureTimeoutId.value !== null) {
      window.clearTimeout(measureTimeoutId.value);
    }
    measureTimeoutId.value = window.setTimeout(updateContentWidth, 100);
  },
  { deep: true, immediate: true },
);

watch(
  [contentWidth, () => props.settings.speed],
  ([width, speed]) => {
    if (!trackRef.value || width <= 0) {
      return;
    }
    const duration = speed / 1000;
    trackRef.value.style.setProperty("--carousel-content-width", `${width}px`);
    trackRef.value.style.setProperty("--carousel-duration", `${duration}s`);
  },
  { immediate: true },
);
</script>
