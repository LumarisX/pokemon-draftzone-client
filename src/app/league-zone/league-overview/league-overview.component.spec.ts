import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueOverviewComponent } from './league-overview.component';

describe('LeagueOverviewComponent', () => {
  let component: LeagueOverviewComponent;
  let fixture: ComponentFixture<LeagueOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
