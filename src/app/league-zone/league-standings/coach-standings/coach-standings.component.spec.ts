import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachStandingsComponent } from './coach-standings.component';

describe('CoachStandingsComponent', () => {
  let component: CoachStandingsComponent;
  let fixture: ComponentFixture<CoachStandingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachStandingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachStandingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
