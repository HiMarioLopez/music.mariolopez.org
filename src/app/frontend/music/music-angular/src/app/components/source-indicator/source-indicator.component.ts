import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
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
  readonly source = input<MusicSource | undefined>(undefined);
  readonly size = input<'small' | 'large'>('small');
  readonly url = input<string | undefined>(undefined);

  readonly actualSource = computed<MusicSource>(() => {
    // Default to Apple Music if no source is provided (original data source)
    // Only hide indicator if explicitly set to 'unknown'
    const sourceValue = this.source();
    return sourceValue && sourceValue !== 'unknown' ? sourceValue : 'apple';
  });

  readonly displayName = computed(() => {
    return getMusicSourceDisplayName(this.actualSource());
  });

  handleClick(): void {
    const urlValue = this.url();
    if (urlValue) {
      openUrlInNewTab(urlValue);
    }
  }
}

