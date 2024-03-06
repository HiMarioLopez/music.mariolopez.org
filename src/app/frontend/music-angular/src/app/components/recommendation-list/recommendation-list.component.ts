import { Component, Input } from '@angular/core';
import { Song } from '../../../types/Song';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-recommendation-list',
  standalone: true,
  imports: [NgForOf],
  templateUrl: './recommendation-list.component.html',
  styleUrl: './recommendation-list.component.css'
})
export class RecommendationListComponent {
  @Input() recommendations: Song[] = [];
}
