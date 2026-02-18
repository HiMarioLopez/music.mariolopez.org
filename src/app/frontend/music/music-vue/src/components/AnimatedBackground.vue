<template>
  <div :class="styles.container">
    <div :class="styles.blobsContainer">
      <div
        v-for="blob in blobs"
        :key="`${blob.id}-${blob.color}`"
        :class="styles.blob"
        :style="getBlobStyle(blob)"
      ></div>
    </div>

    <div :class="styles.gradientOverlay" :style="gradientOverlayStyle"></div>

    <div :class="styles.meshGradient">
      <div
        v-for="point in meshPoints"
        :key="`${point.color}-${point.index}`"
        :class="styles.meshPoint"
        :style="getMeshPointStyle(point)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type CSSProperties } from "vue";
import styles from "./AnimatedBackground.module.css";

interface Props {
  colors: string[];
}

interface Blob {
  id: number;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  moveX: [string, string, string];
  moveY: [string, string, string];
}

interface MeshPoint {
  color: string;
  index: number;
  x: [string, string];
  y: [string, string];
}

const DEFAULT_COLORS = ["#42b883", "#35495e", "#41d1ff", "#2f495e", "#6ee7b7"];
const props = defineProps<Props>();
const isMobile = ref(false);

const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const displayColors = computed(() => {
  return props.colors && props.colors.length > 0 ? props.colors : DEFAULT_COLORS;
});

const colorsKey = computed(() => displayColors.value.join(","));

const blobs = computed<Blob[]>(() => {
  const blobCount = isMobile.value ? 6 : 10;
  const newBlobs: Blob[] = [];

  for (let index = 0; index < blobCount; index += 1) {
    const random = seededRandom(index + colorsKey.value.length);
    const baseX = random() * 100;
    const baseY = random() * 100;

    newBlobs.push({
      id: index,
      initialX: baseX,
      initialY: baseY,
      size: isMobile.value ? 250 + random() * 200 : 400 + random() * 350,
      color: displayColors.value[index % displayColors.value.length],
      duration: 25 + random() * 20,
      delay: random() * 8,
      moveX: [
        `${(random() - 0.5) * 60}%`,
        `${(random() - 0.5) * 60}%`,
        `${(random() - 0.5) * 60}%`,
      ],
      moveY: [
        `${(random() - 0.5) * 60}%`,
        `${(random() - 0.5) * 60}%`,
        `${(random() - 0.5) * 60}%`,
      ],
    });
  }

  return newBlobs;
});

const meshPoints = computed<MeshPoint[]>(() => {
  return displayColors.value.map((color, index) => {
    const random = seededRandom(index + colorsKey.value.length + 1000);
    return {
      color,
      index,
      x: [`${(random() - 0.5) * 20}%`, `${(random() - 0.5) * 20}%`],
      y: [`${(random() - 0.5) * 20}%`, `${(random() - 0.5) * 20}%`],
    };
  });
});

const gradientOverlayStyle = computed<CSSProperties>(() => {
  return {
    background: `radial-gradient(circle at 50% 50%, ${displayColors.value.join(", ")})`,
  };
});

const getBlobStyle = (blob: Blob): CSSProperties => {
  const style = {
    background: `radial-gradient(circle, ${blob.color}80, ${blob.color}40, ${blob.color}20)`,
    width: `${blob.size}px`,
    height: `${blob.size}px`,
    left: `${blob.initialX}%`,
    top: `${blob.initialY}%`,
    "--blob-duration": `${blob.duration}s`,
    "--blob-delay": `${blob.delay}s`,
    "--blob-x-start": blob.moveX[0],
    "--blob-x-mid": blob.moveX[1],
    "--blob-x-end": blob.moveX[2],
    "--blob-y-start": blob.moveY[0],
    "--blob-y-mid": blob.moveY[1],
    "--blob-y-end": blob.moveY[2],
  } as CSSProperties & Record<string, string>;

  return style;
};

const getMeshPointStyle = (point: MeshPoint): CSSProperties => {
  const style = {
    background: `radial-gradient(circle, ${point.color}80, ${point.color}40, transparent)`,
    left: `${(point.index * 25) % 100}%`,
    top: `${(Math.floor(point.index / 4) * 40) % 100}%`,
    "--mesh-duration": `${12 + point.index * 2}s`,
    "--mesh-delay": `${point.index * 0.3}s`,
    "--mesh-x-start": point.x[0],
    "--mesh-x-end": point.x[1],
    "--mesh-y-start": point.y[0],
    "--mesh-y-end": point.y[1],
  } as CSSProperties & Record<string, string>;

  return style;
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 || window.innerHeight < 600;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>
