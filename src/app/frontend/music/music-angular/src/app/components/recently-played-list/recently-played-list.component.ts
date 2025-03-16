import { NgForOf } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-recently-played-list',
  standalone: true,
  imports: [NgForOf],
  templateUrl: './recently-played-list.component.html',
  styleUrl: './recently-played-list.component.css'
})
export class RecentlyPlayedListComponent {
  @ViewChild('scrollContainer') scrollRef!: ElementRef;

  recentlyPlayed = [
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: 'https://placehold.co/50',
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: 'https://placehold.co/50',
    },
    {
      songTitle: 'Song Three',
      artistName: 'Artist Three',
      albumName: 'Album Three',
      albumCoverUrl: 'https://placehold.co/50',
    },
    {
      songTitle: 'Song Four',
      artistName: 'Artist Four',
      albumName: 'Album Four',
      albumCoverUrl: 'https://placehold.co/50',
    },
    {
      songTitle: 'Song Five',
      artistName: 'Artist Five',
      albumName: 'Album Five',
      albumCoverUrl: 'https://placehold.co/50',
    }
  ]

  ngAfterViewInit(): void {
    const scroll = this.scrollRef.nativeElement;

    let startLeft = 0;
    const step = () => {
      if (scroll.offsetWidth + startLeft >= scroll.scrollWidth) {
        startLeft = 0; // Reset to start if end reached
        scroll.scrollLeft = startLeft;
      } else {
        startLeft += 0.25; // Increment the scroll position
        scroll.scrollLeft = startLeft;
      }
      requestAnimationFrame(step);
    };

    step();
  }
}
