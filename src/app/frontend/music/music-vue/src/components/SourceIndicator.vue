<template>
  <div
    :class="[styles.indicator, sizeClass, styles[actualSource]]"
    :title="url ? `Click to open in ${displayName}` : displayName"
    :style="{
      cursor: url ? 'pointer' : 'default',
      pointerEvents: url ? 'auto' : 'none',
      ...indicatorStyle,
    }"
    @click="handleClick"
  >
    <img
      :src="actualSource === 'apple' ? appleMusicLogo : spotifyLogo"
      :alt="displayName"
      :style="{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        margin: 0,
        borderRadius: 0,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import appleMusicLogo from "../assets/apple-music.svg";
import spotifyLogo from "../assets/spotify.svg";
import type { MusicSource } from "../types/MusicSource";
import { getMusicSourceDisplayName } from "../types/MusicSource";
import { openUrlInNewTab } from "../utils/navigation";
import styles from "./SourceIndicator.module.css";

interface Props {
  source?: MusicSource;
  size?: "small" | "large";
  url?: string;
}

const props = withDefaults(defineProps<Props>(), {
  source: "apple",
  size: "small",
  url: undefined,
});

const actualSource = computed<MusicSource>(() => {
  return props.source && props.source !== "unknown" ? props.source : "apple";
});

const displayName = computed(() => {
  return getMusicSourceDisplayName(actualSource.value);
});

const sizeClass = computed(() => {
  return props.size === "large" ? styles.large : styles.small;
});

const indicatorStyle = computed(() => {
  return props.size === "large"
    ? { width: "26px", height: "26px", padding: "4px" }
    : { width: "14px", height: "14px", padding: "2px" };
});

const handleClick = () => {
  openUrlInNewTab(props.url);
};
</script>
