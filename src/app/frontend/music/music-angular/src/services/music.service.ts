import { DestroyRef, Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, firstValueFrom, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { AppleMusicSong } from '../models/apple-music-song';
import { MusicSource } from '../models/music-source';

const HISTORY_AUTO_REFRESH_INTERVAL = 60000; // Refresh every minute
const APPLE_MUSIC_LIMIT = 15; // Songs from Apple Music
const SPOTIFY_LIMIT = 15; // Songs from Spotify

// TEMPORARY: Enable mock source data for testing indicators
// Set to false once backend provides real source data
const ENABLE_MOCK_SOURCE_DATA = false;

// Bright, vibrant color palettes
const BRIGHT_PALETTES = [
  // Vibrant Purple/Pink/Blue
  ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#fb5607'],
  // Electric Cyan/Pink/Orange
  ['#ff006e', '#00f5ff', '#ffbe0b', '#fb5607', '#8338ec'],
  // Neon Green/Blue/Purple
  ['#06ffa5', '#00f5ff', '#8338ec', '#ff006e', '#ffbe0b'],
  // Hot Pink/Yellow/Blue
  ['#ff006e', '#ffbe0b', '#3a86ff', '#06ffa5', '#8338ec'],
  // Orange/Red/Cyan
  ['#fb5607', '#ff006e', '#00f5ff', '#8338ec', '#ffbe0b'],
  // Blue/Purple/Green
  ['#3a86ff', '#8338ec', '#06ffa5', '#ff006e', '#ffbe0b'],
];

@Injectable({
  providedIn: 'root'
})
export class MusicService {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // State signals
  private readonly _nowPlaying = signal<AppleMusicSong | null>(null);
  private readonly _recentlyPlayed = signal<AppleMusicSong[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _gradientColors = signal<string[]>(BRIGHT_PALETTES[0]);

  // Public readonly signals
  readonly nowPlaying = this._nowPlaying.asReadonly();
  readonly recentlyPlayed = this._recentlyPlayed.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly gradientColors = this._gradientColors.asReadonly();

  constructor() {
    effect(
      () => {
        const song = this._nowPlaying();
        this._gradientColors.set(this.getBrightPalette(song));
      },
      { allowSignalWrites: true }
    );

    void this.fetchMusicHistory();

    if (this.isBrowser) {
      this.startAutoRefresh();
    }
  }

  // Select a palette based on song ID for consistency, or rotate
  private getBrightPalette(song: AppleMusicSong | null): string[] {
    if (!song) {
      return BRIGHT_PALETTES[0];
    }
    // Use song ID to consistently pick a palette for the same song
    const paletteIndex = parseInt(song.id.slice(-1), 16) % BRIGHT_PALETTES.length;
    return BRIGHT_PALETTES[paletteIndex];
  }

  private async fetchMusicHistory(): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      const { appleMusic, spotify } = await firstValueFrom(
        forkJoin({
          appleMusic: this.apiService.getMusicHistory(APPLE_MUSIC_LIMIT),
          spotify: this.apiService.getSpotifyMusicHistory(SPOTIFY_LIMIT),
        })
      );

      // Process Apple Music songs - ensure source is set to 'apple' if not specified
      const appleMusicSongs = appleMusic.items.map((item) => ({
        ...item,
        source: (item.source || 'apple') as MusicSource,
      }));

      // Process Spotify songs - default to 'apple' if no source, but preserve 'spotify' if set
      const spotifySongs = spotify.items.map((item) => ({
        ...item,
        source: (item.source || 'apple') as MusicSource,
      }));

      // Merge both arrays
      const allSongs = [...appleMusicSongs, ...spotifySongs];

      // Sort by processedTimestamp (most recent first)
      allSongs.sort((a, b) => {
        const timestampA = new Date(a.processedTimestamp).getTime();
        const timestampB = new Date(b.processedTimestamp).getTime();
        return timestampB - timestampA;
      });

      if (allSongs.length > 0) {
        // TEMPORARY: Add mock source data for testing (if enabled)
        let processedItems = allSongs;
        if (ENABLE_MOCK_SOURCE_DATA) {
          processedItems = allSongs.map((item, index) => {
            // Alternate between apple, spotify, and no source for testing
            const sources: (MusicSource | undefined)[] = ['apple', 'spotify', undefined];
            return {
              ...item,
              source: sources[index % 3] || 'apple',
            };
          });
        }

        // Set the first (most recent) item as now playing
        this._nowPlaying.set(processedItems[0]);

        // Set the rest as recently played (remaining songs after now playing)
        this._recentlyPlayed.set(processedItems.slice(1));
      } else {
        this._nowPlaying.set(null);
        this._recentlyPlayed.set([]);
      }
    } catch (err) {
      let errorMessage = 'Failed to load music history';
      
      if (err instanceof Error) {
        // Check if it's an ApiError with a user-friendly message
        if (err.name === 'ApiError') {
          errorMessage = err.message;
        } else {
          errorMessage = 'Unable to connect to the music service. Please try again later.';
        }
      }
      
      this._error.set(errorMessage);
      console.error('Error fetching music history:', err);
    } finally {
      this._loading.set(false);
    }
  }

  async refreshMusicHistory(): Promise<void> {
    await this.fetchMusicHistory();
  }

  private startAutoRefresh(): void {
    // Use RxJS interval with takeUntilDestroyed for automatic cleanup
    interval(HISTORY_AUTO_REFRESH_INTERVAL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.fetchMusicHistory();
      });
  }
}

