import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-apple-music-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <path d="M199 359V199q0-9 10-11l138-28q11-2 12 10v122q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69V88s0-20-17-15l-170 35s-13 2-13 18v203q0 15-45 20c-57 9-48 105 30 79 30-11 35-40 35-69"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppleMusicIconComponent {}

@Component({
  selector: 'app-spotify-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="currentColor"
    >
      <path d="M38.16,21.36 C30.48,16.8 17.64,16.32 10.32,18.6 C9.12,18.96 7.92,18.24 7.56,17.16 C7.2,15.96 7.92,14.76 9,14.4 C17.52,11.88 31.56,12.36 40.44,17.64 C41.52,18.24 41.88,19.68 41.28,20.76 C40.68,21.6 39.24,21.96 38.16,21.36 M37.92,28.08 C37.32,28.92 36.24,29.28 35.4,28.68 C28.92,24.72 19.08,23.52 11.52,25.92 C10.56,26.16 9.48,25.68 9.24,24.72 C9,23.76 9.48,22.68 10.44,22.44 C19.2,19.8 30,21.12 37.44,25.68 C38.16,26.04 38.52,27.24 37.92,28.08 M35.04,34.68 C34.56,35.4 33.72,35.64 33,35.16 C27.36,31.68 20.28,30.96 11.88,32.88 C11.04,33.12 10.32,32.52 10.08,31.8 C9.84,30.96 10.44,30.24 11.16,30 C20.28,27.96 28.2,28.8 34.44,32.64 C35.28,33 35.4,33.96 35.04,34.68 M24,0 C10.8,0 0,10.8 0,24 C0,37.2 10.8,48 24,48 C37.2,48 48,37.2 48,24 C48,10.8 37.32,0 24,0"/>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpotifyIconComponent {}

