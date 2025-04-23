import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueSettingsComponent } from './league-settings.component';

describe('LeagueSettingsComponent', () => {
  let component: LeagueSettingsComponent;
  let fixture: ComponentFixture<LeagueSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
