import { Component, Input, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppleMusicSong } from '../../../../../models/apple-music-song';
import { getProcessedArtworkUrl } from '../../../../../utils/image-processing';
import { openUrlInNewTab } from '../../../../../utils/navigation';
import { SourceIndicatorComponent } from '../../../source-indicator/source-indicator.component';

@Component({
  selector: 'app-song-item',
  standalone: true,
  imports: [CommonModule, SourceIndicatorComponent],
  templateUrl: './song-item.component.html',
  styleUrl: './song-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongItemComponent {
  @Input({ required: true }) song!: AppleMusicSong;
  @Input({ required: true }) index!: number;
  @Input({ required: true }) rowName!: string;

  readonly imageError = signal(false);

  readonly artworkUrl = computed(() => getProcessedArtworkUrl(this.song?.artworkUrl));

  // Expose getProcessedArtworkUrl to template
  getProcessedArtworkUrl = getProcessedArtworkUrl;

  handleImageError(): void {
    this.imageError.set(true);
  }

  handleAlbumArtClick(): void {
    openUrlInNewTab(this.song.url);
  }
}

