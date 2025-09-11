import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueManageDraftComponent } from './league-manage-draft.component';

describe('LeagueManageDraftComponent', () => {
  let component: LeagueManageDraftComponent;
  let fixture: ComponentFixture<LeagueManageDraftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueManageDraftComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueManageDraftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
