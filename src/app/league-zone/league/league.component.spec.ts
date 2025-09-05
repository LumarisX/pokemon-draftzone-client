import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueDashboardComponent } from './league.component';

describe('LeagueComponent', () => {
  let component: LeagueDashboardComponent;
  let fixture: ComponentFixture<LeagueDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
