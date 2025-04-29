import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueRulesComponent } from './league-rules.component';

describe('LeagueRulesComponent', () => {
  let component: LeagueRulesComponent;
  let fixture: ComponentFixture<LeagueRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueRulesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
