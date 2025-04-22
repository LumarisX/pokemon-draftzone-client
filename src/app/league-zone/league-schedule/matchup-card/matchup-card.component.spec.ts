import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchupCardComponent } from './matchup-card.component';

describe('MatchupCardComponent', () => {
  let component: MatchupCardComponent;
  let fixture: ComponentFixture<MatchupCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchupCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchupCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
