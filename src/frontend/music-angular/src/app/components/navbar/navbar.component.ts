import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements AfterViewInit {
  basePath = environment.assetsBasePath;

  @ViewChild('navbar') navbar!: ElementRef;

  // Scroll to the right when the component is initialized
  ngAfterViewInit() {
    if (this.navbar !== null) {
      const navbarElement = this.navbar.nativeElement;
      navbarElement.scrollLeft = navbarElement.scrollWidth - navbarElement.clientWidth;
    }
  }
}
