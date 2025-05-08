import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueSidebarComponent } from './league-sidebar.component';

describe('LeagueSidebarComponent', () => {
  let component: LeagueSidebarComponent;
  let fixture: ComponentFixture<LeagueSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
