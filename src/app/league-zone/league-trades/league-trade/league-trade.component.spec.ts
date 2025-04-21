import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueTradeComponent } from './league-trade.component';

describe('LeagueTradeComponent', () => {
  let component: LeagueTradeComponent;
  let fixture: ComponentFixture<LeagueTradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueTradeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueTradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
