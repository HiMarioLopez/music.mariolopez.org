import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, effect, inject, signal, input, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Blob {
  id: number;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
  moveX: string[];
  moveY: string[];
}

// Default fallback colors if none provided - bright vibrant palette
const DEFAULT_COLORS = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#fb5607'];

@Component({
  selector: 'app-animated-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-background.component.html',
  styleUrl: './animated-background.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimatedBackgroundComponent implements AfterViewInit {
  readonly colors = input<string[]>([]);

  private readonly _isMobile = signal<boolean>(false);
  private readonly _blobs = signal<Blob[]>([]);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  readonly displayColors = computed(() => {
    const colorsArray = this.colors();
    return colorsArray && colorsArray.length > 0 ? colorsArray : DEFAULT_COLORS;
  });

  private resizeListener?: () => void;

  constructor() {
    // Regenerate blobs when colors change - moved from ngOnInit
    effect(() => {
      this.displayColors();
      if (this.isBrowser) {
        this.generateBlobs();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      this.generateBlobs();
      return;
    }

    this.checkMobile();
    this.generateBlobs();
    
    this.resizeListener = () => {
      this.checkMobile();
      this.generateBlobs();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeListener);
      
      // Use destroyRef for cleanup instead of ngOnDestroy
      this.destroyRef.onDestroy(() => {
        if (this.resizeListener) {
          window.removeEventListener('resize', this.resizeListener);
          this.resizeListener = undefined;
        }
      });
    }
  }

  private checkMobile(): void {
    if (!this.isBrowser) {
      this._isMobile.set(false);
      return;
    }

    this._isMobile.set(window.innerWidth < 768 || window.innerHeight < 600);
  }

  private generateBlobs(): void {
    const blobCount = this._isMobile() ? 6 : 10;
    const newBlobs: Blob[] = [];
    const colors = this.displayColors();

    for (let i = 0; i < blobCount; i++) {
      const colorIndex = i % colors.length;
      const baseX = Math.random() * 100;
      const baseY = Math.random() * 100;

      // Create more interesting movement patterns
      const moveX = [
        `${baseX + (Math.random() - 0.5) * 60}%`,
        `${baseX + (Math.random() - 0.5) * 60}%`,
        `${baseX + (Math.random() - 0.5) * 60}%`,
        `${baseX}%`,
      ];

      const moveY = [
        `${baseY + (Math.random() - 0.5) * 60}%`,
        `${baseY + (Math.random() - 0.5) * 60}%`,
        `${baseY + (Math.random() - 0.5) * 60}%`,
        `${baseY}%`,
      ];

      newBlobs.push({
        id: i,
        initialX: baseX,
        initialY: baseY,
        size: this._isMobile() ? 250 + Math.random() * 200 : 400 + Math.random() * 350,
        color: colors[colorIndex],
        duration: 25 + Math.random() * 20, // 25-45 seconds
        moveX,
        moveY,
      });
    }

    this._blobs.set(newBlobs);
  }

  get blobs(): Blob[] {
    return this._blobs();
  }

  getBlobStyle(blob: Blob): Record<string, string> {
    return {
      background: `radial-gradient(circle, ${blob.color}80, ${blob.color}40, ${blob.color}20)`,
      width: `${blob.size}px`,
      height: `${blob.size}px`,
      left: `${blob.initialX}%`,
      top: `${blob.initialY}%`,
    };
  }

  getGradientStyle(): Record<string, string> {
    return {
      background: `radial-gradient(circle at 50% 50%, ${this.displayColors().join(', ')})`,
    };
  }

  // Expose Math to template
  readonly Math = Math;

  // Helper method to calculate mesh point top position
  getMeshPointTop(index: number): string {
    return `${(Math.floor(index / 4) * 40 % 100)}%`;
  }
}

