import { Component, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ElementRef, ViewChild, signal, input, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppleMusicSong } from '../../../../../models/apple-music-song';
import { SongItemComponent } from '../song-item/song-item.component';

interface CarouselSettings {
  speed: number; // Duration in ms for one complete cycle
  direction: 'left' | 'right'; // Direction of movement
}

@Component({
  selector: 'app-carousel-row',
  standalone: true,
  imports: [CommonModule, SongItemComponent],
  templateUrl: './carousel-row.component.html',
  styleUrl: './carousel-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarouselRowComponent implements AfterViewInit, OnDestroy {
  readonly songs = input.required<AppleMusicSong[]>();
  readonly settings = input.required<CarouselSettings>();
  readonly rowName = input.required<string>();
  @ViewChild('trackRef', { static: false }) trackRef?: ElementRef<HTMLDivElement>;

  readonly isHovered = signal(false);
  readonly contentWidth = signal(0);

  private resizeListener?: () => void;

  // Duplicate songs multiple times for seamless infinite scroll
  readonly duplicatedSongs = computed(() => {
    const songsArray = this.songs();
    return songsArray && songsArray.length > 0
      ? [...songsArray, ...songsArray, ...songsArray]
      : [];
  });

  constructor() {
    // Watch for songs changes and update content width
    // Note: trackRef won't be available in constructor, so we handle it in ngAfterViewInit
    // This effect will trigger when songs change after view init
    effect(() => {
      const songsArray = this.songs(); // Track songs signal
      if (songsArray.length > 0 && this.trackRef?.nativeElement) {
        // Use requestAnimationFrame instead of setTimeout for better performance
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.updateContentWidth();
          });
        });
      }
    });
  }

  ngAfterViewInit(): void {
    // Use requestAnimationFrame for better performance than setTimeout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateContentWidth();
      });
    });

    this.resizeListener = () => {
      this.updateContentWidth();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private updateContentWidth(): void {
    if (this.trackRef?.nativeElement) {
      const items = this.trackRef.nativeElement.querySelectorAll('[data-carousel-item]');
      if (items.length > 0) {
        let totalWidth = 0;
        const thirdLength = items.length / 3;
        for (let i = 0; i < thirdLength; i++) {
          totalWidth += (items[i] as HTMLElement).offsetWidth;
        }
        this.contentWidth.set(totalWidth);
        this.updateCSSProperties();
      }
    }
  }

  private updateCSSProperties(): void {
    if (this.trackRef?.nativeElement && this.contentWidth() > 0) {
      const track = this.trackRef.nativeElement;
      const settings = this.settings();
      const duration = settings.speed / 1000; // Convert ms to seconds

      track.style.setProperty('--carousel-content-width', `${this.contentWidth()}px`);
      track.style.setProperty('--carousel-duration', `${duration}s`);
    }
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
  }

  readonly animationClass = computed(() => {
    return this.settings().direction === 'right' ? 'carousel-track-right' : 'carousel-track-left';
  });

  trackByIndex(index: number, song: AppleMusicSong): string {
    return `${this.rowName()}-${song.id}-${index}`;
  }
}

