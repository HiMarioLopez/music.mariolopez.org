import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentlyPlayedListComponent } from './recently-played-list.component';

describe('RecentlyPlayedListComponent', () => {
  let component: RecentlyPlayedListComponent;
  let fixture: ComponentFixture<RecentlyPlayedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentlyPlayedListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecentlyPlayedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
