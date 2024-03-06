import { Component } from '@angular/core';

@Component({
  selector: 'app-now-playing',
  standalone: true,
  imports: [],
  templateUrl: './now-playing.component.html',
  styleUrl: './now-playing.component.css'
})
export class NowPlayingComponent {

  currentSong = {
    songTitle: "Song Title",
    artistName: "Artist",
    albumName: "Album",
    albumCoverUrl: "https://via.placeholder.com/300"
  };

}
