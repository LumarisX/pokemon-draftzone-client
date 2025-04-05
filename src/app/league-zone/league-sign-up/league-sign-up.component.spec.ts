import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueSignUpComponent } from './league-sign-up.component';

describe('LeagueSignUpComponent', () => {
  let component: LeagueSignUpComponent;
  let fixture: ComponentFixture<LeagueSignUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueSignUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueSignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
