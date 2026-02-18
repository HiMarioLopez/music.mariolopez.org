<template>
  <footer :class="styles.footer">
    <div :class="styles.footerComponentLinkContainer">
      <a
        href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-vue"
        target="_blank"
        rel="noopener noreferrer"
      >
        Site Source
      </a>
      <a
        href="https://music.mariolopez.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Randomize
      </a>
      <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">
        Vue
      </a>
    </div>
    <div :class="styles.footerComponentCopyrightContainer">
      <a href="https://mariolopez.org" target="_blank" rel="noopener noreferrer">
        © {{ currentYear }} Mario Lopez
      </a>
    </div>
    <div :class="styles.footerBuildInfo">Build: {{ buildTime }}</div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatBuildTime } from "../utils/formatters";
import styles from "./Footer.module.css";

const currentYear = new Date().getFullYear();

const buildTime = computed(() => {
  return typeof __BUILD_TIME__ === "string"
    ? formatBuildTime(__BUILD_TIME__)
    : "Unknown";
});
</script>
  