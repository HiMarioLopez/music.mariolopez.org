<template>
  <div :class="styles.recentlyPlayedSkeletonContainer">
    <div
      v-for="row in skeletonRows"
      :key="`skeleton-row-${row}`"
      :class="styles.recentlyPlayedSkeletonRow"
    >
      <div
        v-for="item in skeletonItems"
        :key="`skeleton-${row}-${item}`"
        :class="styles.recentlyPlayedSkeletonSong"
      >
        <div
          :class="[styles.recentlyPlayedSkeletonImg, styles.skeletonLoader]"
        ></div>
        <div :class="styles.recentlyPlayedSkeletonText">
          <div
            :class="[styles.recentlyPlayedSkeletonTitle, styles.skeletonLoader]"
          ></div>
          <div
            :class="[
              styles.recentlyPlayedSkeletonSubtitle,
              styles.skeletonLoader,
            ]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import styles from "./SkeletonLoader.module.css";

const skeletonRows = [1, 2, 3];
const skeletonItems = [1, 2, 3, 4];
</script>
