<template>
  <div>
    <div :class="styles.song">
      <div :class="styles.albumArtContainer">
        <img
          :src="imageError ? getProcessedArtworkUrl(undefined) : artworkUrl"
          :alt="`${song.name} Album Cover`"
          :title="
            song.url
              ? `Click to open ${song.name} in Apple Music`
              : `${song.name} by ${song.artistName}`
          "
          :style="{ cursor: song.url ? 'pointer' : 'default' }"
          @error="handleImageError"
          @click="handleAlbumArtClick"
        />
      </div>
      <div :class="styles.songTextContainer">
        <div :class="styles.songTitleContainer">
          <SourceIndicator :source="song.source" size="small" :url="song.url" />
          <h3 :title="song.name">{{ song.name }}</h3>
        </div>
        <p :title="`${song.artistName} - ${song.albumName}`">
          {{ song.artistName }} - {{ song.albumName }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { AppleMusicSong } from "../../models/AppleMusicSong";
import { getProcessedArtworkUrl } from "../../utils/imageProcessing";
import { openUrlInNewTab } from "../../utils/navigation";
import SourceIndicator from "../SourceIndicator.vue";
import styles from "./SongItem.module.css";

interface Props {
  song: AppleMusicSong;
  index: number;
  rowName: string;
}

const props = defineProps<Props>();
const imageError = ref(false);

const artworkUrl = computed(() => {
  return getProcessedArtworkUrl(props.song.artworkUrl);
});

const handleImageError = () => {
  imageError.value = true;
};

const handleAlbumArtClick = () => {
  openUrlInNewTab(props.song.url);
};
</script>
