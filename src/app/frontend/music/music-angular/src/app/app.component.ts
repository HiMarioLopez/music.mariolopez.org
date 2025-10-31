import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { NowPlayingComponent } from './components/now-playing/now-playing.component';
import { RecentlyPlayedListComponent } from './components/recently-played-list/recently-played-list.component';
import { AnimatedBackgroundComponent } from './components/animated-background/animated-background.component';
import { MusicService } from '../services/music.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavbarComponent,
    FooterComponent,
    NowPlayingComponent,
    RecentlyPlayedListComponent,
    AnimatedBackgroundComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly musicService = inject(MusicService);
}

