import { Component, Input, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ElementRef, ViewChild, signal, OnChanges, SimpleChanges } from '@angular/core';
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
export class CarouselRowComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) songs!: AppleMusicSong[];
  @Input({ required: true }) settings!: CarouselSettings;
  @Input({ required: true }) rowName!: string;
  @ViewChild('trackRef', { static: false }) trackRef?: ElementRef<HTMLDivElement>;

  readonly isHovered = signal(false);
  readonly contentWidth = signal(0);

  private resizeListener?: () => void;

  // Duplicate songs multiple times for seamless infinite scroll
  get duplicatedSongs(): AppleMusicSong[] {
    return this.songs ? [...this.songs, ...this.songs, ...this.songs] : [];
  }

  ngOnInit(): void {
    // Component initialized
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['songs'] && !changes['songs'].firstChange && this.trackRef) {
      setTimeout(() => {
        this.updateContentWidth();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    // Use a small delay to ensure DOM is ready
    setTimeout(() => {
      this.updateContentWidth();
    }, 100);

    this.resizeListener = () => {
      this.updateContentWidth();
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
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
      const duration = this.settings.speed / 1000; // Convert ms to seconds

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

  get animationClass(): string {
    return this.settings.direction === 'right' ? 'carousel-track-right' : 'carousel-track-left';
  }

  trackByIndex(index: number, song: AppleMusicSong): string {
    return `${this.rowName}-${song.id}-${index}`;
  }
}

