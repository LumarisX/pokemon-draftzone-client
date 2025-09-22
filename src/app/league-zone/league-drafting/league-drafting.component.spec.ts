import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeagueDraftComponent } from './league-drafting.component';

describe('LeagueComponent', () => {
  let component: LeagueDraftComponent;
  let fixture: ComponentFixture<LeagueDraftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueDraftComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueDraftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
