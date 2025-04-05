import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueCoachComponent } from './league-coach.component';

describe('LeagueCoachComponent', () => {
  let component: LeagueCoachComponent;
  let fixture: ComponentFixture<LeagueCoachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueCoachComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueCoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
