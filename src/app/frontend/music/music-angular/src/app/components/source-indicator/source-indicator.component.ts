import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicSource, getMusicSourceDisplayName } from '../../../models/music-source';
import { openUrlInNewTab } from '../../../utils/navigation';
import { AppleMusicIconComponent } from '../icons/icons.component';
import { SpotifyIconComponent } from '../icons/icons.component';

@Component({
  selector: 'app-source-indicator',
  standalone: true,
  imports: [CommonModule, AppleMusicIconComponent, SpotifyIconComponent],
  templateUrl: './source-indicator.component.html',
  styleUrl: './source-indicator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SourceIndicatorComponent {
  @Input() source?: MusicSource;
  @Input() size: 'small' | 'large' = 'small';
  @Input() url?: string;

  get actualSource(): MusicSource {
    // Default to Apple Music if no source is provided (original data source)
    // Only hide indicator if explicitly set to 'unknown'
    return this.source && this.source !== 'unknown' ? this.source : 'apple';
  }

  get displayName(): string {
    return getMusicSourceDisplayName(this.actualSource);
  }

  handleClick(): void {
    if (this.url) {
      openUrlInNewTab(this.url);
    }
  }
}

