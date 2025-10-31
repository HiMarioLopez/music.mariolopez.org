import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements AfterViewInit {
  @ViewChild('navElement', { static: false }) navElement!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    // Scroll to the rightmost position after view initialization
    // This ensures the Angular icon (which is near the right) is visible
    setTimeout(() => {
      if (this.navElement?.nativeElement) {
        const nav = this.navElement.nativeElement;
        nav.scrollLeft = nav.scrollWidth - nav.clientWidth;
      }
    }, 0);
  }
}

