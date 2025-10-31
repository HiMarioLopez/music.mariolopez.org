import { Component, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../services/music.service';
import { AppleMusicSong } from '../../../models/apple-music-song';
import { CarouselRowComponent } from './components/carousel-row/carousel-row.component';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';

interface CarouselSettings {
  speed: number; // Duration in ms for one complete cycle
  direction: 'left' | 'right'; // Direction of movement
}

@Component({
  selector: 'app-recently-played-list',
  standalone: true,
  imports: [CommonModule, CarouselRowComponent, SkeletonLoaderComponent],
  templateUrl: './recently-played-list.component.html',
  styleUrl: './recently-played-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentlyPlayedListComponent {
  readonly musicService = inject(MusicService);

  // Carousel settings - normalized speed
  private readonly normalizedSpeed = 100000; // 100 seconds per cycle
  
  readonly topSliderSettings: CarouselSettings = {
    speed: this.normalizedSpeed,
    direction: 'left', // Moves left to right (content moves left)
  };

  readonly middleSliderSettings: CarouselSettings = {
    speed: this.normalizedSpeed,
    direction: 'right', // Moves right to left (content moves right)
  };

  readonly bottomSliderSettings: CarouselSettings = {
    speed: this.normalizedSpeed,
    direction: 'left', // Moves left to right (content moves left)
  };

  readonly distributedSongs = computed(() => {
    const recentlyPlayed = this.musicService.recentlyPlayed();
    return this.distributeSongs(recentlyPlayed);
  });

  private distributeSongs(recentlyPlayed: AppleMusicSong[]) {
    // Remove duplicate songs based on song ID, keeping first occurrence
    const seenIds = new Set<string>();
    const uniqueSongs = recentlyPlayed.filter((song) => {
      if (seenIds.has(song.id)) {
        return false;
      }
      seenIds.add(song.id);
      return true;
    });

    // Prepare song data - if we have fewer than desired songs, duplicate them
    const processedSongs =
      uniqueSongs.length < 10
        ? [...uniqueSongs, ...uniqueSongs, ...uniqueSongs]
        : [...uniqueSongs];

    // Split songs into three arrays for top, middle, and bottom sliders
    const songCount = processedSongs.length;
    const rowSize = Math.ceil(songCount / 3);

    const topRowSongs = processedSongs.slice(0, rowSize);
    const middleRowSongs = processedSongs.slice(rowSize, rowSize * 2);
    const bottomRowSongs = processedSongs.slice(rowSize * 2);

    // Fallback if not enough songs for any row
    const ensureSongsForRow = (rowSongs: AppleMusicSong[]) => {
      return rowSongs.length > 0 ? rowSongs : [...topRowSongs];
    };

    return {
      topRowSongs,
      middleRowSongs: ensureSongsForRow(middleRowSongs),
      bottomRowSongs: ensureSongsForRow(bottomRowSongs),
    };
  }
}

