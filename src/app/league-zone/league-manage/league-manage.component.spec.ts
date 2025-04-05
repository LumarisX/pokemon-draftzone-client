import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueManageComponent } from './league-manage.component';

describe('LeagueManageComponent', () => {
  let component: LeagueManageComponent;
  let fixture: ComponentFixture<LeagueManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
