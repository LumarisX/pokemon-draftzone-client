import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueFormEditComponent } from './league-form-edit.component';

describe('LeagueFormEditComponent', () => {
  let component: LeagueFormEditComponent;
  let fixture: ComponentFixture<LeagueFormEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueFormEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueFormEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
