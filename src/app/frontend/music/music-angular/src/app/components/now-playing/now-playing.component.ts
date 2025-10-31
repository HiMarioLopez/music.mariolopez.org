import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../services/music.service';
import { formatRelativeTime } from '../../../utils/formatters';
import { getProcessedArtworkUrl } from '../../../utils/image-processing';
import { openUrlInNewTab } from '../../../utils/navigation';
import { SourceIndicatorComponent } from '../source-indicator/source-indicator.component';

@Component({
  selector: 'app-now-playing',
  standalone: true,
  imports: [CommonModule, SourceIndicatorComponent],
  templateUrl: './now-playing.component.html',
  styleUrl: './now-playing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NowPlayingComponent {
  constructor(public musicService: MusicService) {}

  readonly relativeTime = computed(() => {
    const nowPlaying = this.musicService.nowPlaying();
    return nowPlaying?.processedTimestamp
      ? formatRelativeTime(nowPlaying.processedTimestamp)
      : '';
  });

  readonly artworkUrl = computed(() => {
    const nowPlaying = this.musicService.nowPlaying();
    return getProcessedArtworkUrl(nowPlaying?.artworkUrl, '300x300');
  });

  handleAlbumArtClick(): void {
    const nowPlaying = this.musicService.nowPlaying();
    openUrlInNewTab(nowPlaying?.url);
  }

  getTimestampTitle(): string {
    const nowPlaying = this.musicService.nowPlaying();
    return nowPlaying?.processedTimestamp
      ? `Played: ${new Date(nowPlaying.processedTimestamp).toLocaleString()}`
      : '';
  }
}

