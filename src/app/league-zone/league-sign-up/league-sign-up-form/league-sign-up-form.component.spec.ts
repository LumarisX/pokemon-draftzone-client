import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueSignUpFormComponent } from './league-sign-up-form.component';

describe('LeagueSignUpFormComponent', () => {
  let component: LeagueSignUpFormComponent;
  let fixture: ComponentFixture<LeagueSignUpFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueSignUpFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueSignUpFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
