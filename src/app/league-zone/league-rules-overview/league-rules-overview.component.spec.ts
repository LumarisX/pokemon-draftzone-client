import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueRulesOverviewComponent } from './league-rules-overview.component';

describe('LeagueRulesComponent', () => {
  let component: LeagueRulesOverviewComponent;
  let fixture: ComponentFixture<LeagueRulesOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueRulesOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueRulesOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
