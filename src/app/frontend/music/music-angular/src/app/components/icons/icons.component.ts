import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-apple-music-icon",
  standalone: true,
  template: `
    <img
      src="assets/apple-music.svg"
      alt="Apple Music"
      style="width: 100%; height: 100%; object-fit: contain; display: block;"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppleMusicIconComponent {}

@Component({
  selector: "app-spotify-icon",
  standalone: true,
  template: `
    <img
      src="assets/spotify.svg"
      alt="Spotify"
      style="width: 100%; height: 100%; object-fit: contain; display: block;"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotifyIconComponent {}
