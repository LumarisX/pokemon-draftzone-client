import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeagueDraftingComponent } from './league-drafting.component';

describe('LeagueComponent', () => {
  let component: LeagueDraftingComponent;
  let fixture: ComponentFixture<LeagueDraftingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueDraftingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueDraftingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
