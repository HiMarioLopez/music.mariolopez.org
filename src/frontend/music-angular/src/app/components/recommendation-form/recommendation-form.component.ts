import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recommendation-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recommendation-form.component.html',
  styleUrl: './recommendation-form.component.css'
})
export class RecommendationFormComponent {
  @Output() onRecommend = new EventEmitter<string>();
  songTitle: string = '';

  handleSubmit(event: Event) {
    event.preventDefault(); // Prevent the default form submit behavior
    this.onRecommend.emit(this.songTitle);
    this.songTitle = ''; // Reset the form field
  }
}
