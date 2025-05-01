import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueRulesFormComponent } from './league-rules-form.component';

describe('LeagueRulesComponent', () => {
  let component: LeagueRulesFormComponent;
  let fixture: ComponentFixture<LeagueRulesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueRulesFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueRulesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
