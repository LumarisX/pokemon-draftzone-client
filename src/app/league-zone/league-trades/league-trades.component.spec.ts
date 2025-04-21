import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueTradesComponent } from './league-trades.component';

describe('LeagueTradesComponent', () => {
  let component: LeagueTradesComponent;
  let fixture: ComponentFixture<LeagueTradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueTradesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueTradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
