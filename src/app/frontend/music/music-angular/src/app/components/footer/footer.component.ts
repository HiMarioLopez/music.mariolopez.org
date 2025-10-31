import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatBuildTime } from '../../../utils/formatters';
import { BUILD_TIME } from '../../../generated/build-time';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
  
  get buildTime(): string {
    try {
      return formatBuildTime(BUILD_TIME);
    } catch {
      return 'Unknown';
    }
  }
}

