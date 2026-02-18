import {
  inject,
  onMounted,
  onUnmounted,
  provide,
  readonly,
  ref,
  type InjectionKey,
  type Ref,
} from "vue";
import type { AppleMusicSong } from "../models/AppleMusicSong";
import { apiService } from "../services/apiService";
import type { MusicSource } from "../types/MusicSource";

const HISTORY_AUTO_REFRESH_INTERVAL = 60000;
const APPLE_MUSIC_LIMIT = 15;
const SPOTIFY_LIMIT = 15;

const BRIGHT_PALETTES = [
  ["#42b883", "#35495e", "#41d1ff", "#2f495e", "#6ee7b7"],
  ["#4fc08d", "#2f495e", "#22d3ee", "#334155", "#10b981"],
  ["#5eead4", "#42b883", "#1e3a8a", "#2f495e", "#22c55e"],
  ["#34d399", "#0ea5e9", "#42b883", "#1f2937", "#67e8f9"],
  ["#10b981", "#3b82f6", "#2f495e", "#14b8a6", "#86efac"],
  ["#42b883", "#0891b2", "#0f766e", "#334155", "#22d3ee"],
];

export interface MusicStore {
  nowPlaying: Readonly<Ref<AppleMusicSong | null>>;
  recentlyPlayed: Readonly<Ref<AppleMusicSong[]>>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  gradientColors: Readonly<Ref<string[]>>;
  refreshMusicHistory: () => Promise<void>;
  start: () => void;
  stop: () => void;
}

const MusicStoreKey: InjectionKey<MusicStore> = Symbol("MusicStore");

const getBrightPalette = (song: AppleMusicSong | null): string[] => {
  if (!song) {
    return BRIGHT_PALETTES[0];
  }

  const parsed = Number.parseInt(song.id.slice(-1), 16);
  const paletteIndex =
    Number.isNaN(parsed) || parsed < 0 ? 0 : parsed % BRIGHT_PALETTES.length;
  return BRIGHT_PALETTES[paletteIndex];
};

const createMusicStore = (): MusicStore => {
  const nowPlaying = ref<AppleMusicSong | null>(null);
  const recentlyPlayed = ref<AppleMusicSong[]>([]);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);
  const gradientColors = ref<string[]>(BRIGHT_PALETTES[0]);
  let intervalId: number | null = null;

  const fetchMusicHistory = async () => {
    try {
      loading.value = true;
      error.value = null;

      const [appleMusicResponse, spotifyResponse] = await Promise.all([
        apiService.getMusicHistory(APPLE_MUSIC_LIMIT),
        apiService.getSpotifyMusicHistory(SPOTIFY_LIMIT),
      ]);

      const appleMusicSongs = appleMusicResponse.items.map((item) => ({
        ...item,
        source: (item.source || "apple") as MusicSource,
      }));

      const spotifySongs = spotifyResponse.items.map((item) => ({
        ...item,
        source: (item.source || "apple") as MusicSource,
      }));

      const allSongs = [...appleMusicSongs, ...spotifySongs].sort((a, b) => {
        const timestampA = new Date(a.processedTimestamp).getTime();
        const timestampB = new Date(b.processedTimestamp).getTime();
        return timestampB - timestampA;
      });

      if (allSongs.length > 0) {
        nowPlaying.value = allSongs[0];
        recentlyPlayed.value = allSongs.slice(1);
        gradientColors.value = getBrightPalette(allSongs[0]);
      } else {
        nowPlaying.value = null;
        recentlyPlayed.value = [];
        gradientColors.value = BRIGHT_PALETTES[0];
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch music history";
      console.error("Error fetching music history:", err);
    } finally {
      loading.value = false;
    }
  };

  const refreshMusicHistory = async () => {
    await fetchMusicHistory();
  };

  const start = () => {
    if (intervalId !== null) {
      return;
    }
    void fetchMusicHistory();
    intervalId = window.setInterval(() => {
      void fetchMusicHistory();
    }, HISTORY_AUTO_REFRESH_INTERVAL);
  };

  const stop = () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  return {
    nowPlaying: readonly(nowPlaying) as Readonly<Ref<AppleMusicSong | null>>,
    recentlyPlayed: readonly(
      recentlyPlayed,
    ) as Readonly<Ref<AppleMusicSong[]>>,
    loading: readonly(loading) as Readonly<Ref<boolean>>,
    error: readonly(error) as Readonly<Ref<string | null>>,
    gradientColors: readonly(gradientColors) as Readonly<Ref<string[]>>,
    refreshMusicHistory,
    start,
    stop,
  };
};

export const provideMusicStore = (): MusicStore => {
  const store = createMusicStore();
  provide(MusicStoreKey, store);
  onMounted(store.start);
  onUnmounted(store.stop);
  return store;
};

export const useMusicStore = (): MusicStore => {
  const store = inject(MusicStoreKey);
  if (!store) {
    throw new Error("useMusicStore must be used within provideMusicStore()");
  }
  return store;
};
