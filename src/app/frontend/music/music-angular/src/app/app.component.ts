import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Song } from '../types/Song';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NowPlayingComponent } from './components/now-playing/now-playing.component';
import { RecentlyPlayedListComponent } from './components/recently-played-list/recently-played-list.component';
import { RecommendationFormComponent } from './components/recommendation-form/recommendation-form.component';
import { RecommendationListComponent } from './components/recommendation-list/recommendation-list.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    NowPlayingComponent,
    RecentlyPlayedListComponent,
    RecommendationFormComponent,
    RecommendationListComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  recommendations: Song[] = [
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
  ];

  handleNewRecommendation(newSongTitle: string): void {
    const newRecommendation: Song = {
      songTitle: newSongTitle,
      artistName: 'Mock Artist',
      albumName: 'Mock Album',
      albumCoverUrl: 'https://via.placeholder.com/50',
    };

    this.recommendations = [...this.recommendations, newRecommendation];
  }
}
