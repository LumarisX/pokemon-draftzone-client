import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueAuctionComponent } from './league-auction.component';

describe('LeagueAuctionComponent', () => {
  let component: LeagueAuctionComponent;
  let fixture: ComponentFixture<LeagueAuctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueAuctionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueAuctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
