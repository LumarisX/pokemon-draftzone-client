import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueFormNewComponent } from './league-form-new.component';

describe('LeagueFormNewComponent', () => {
  let component: LeagueFormNewComponent;
  let fixture: ComponentFixture<LeagueFormNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueFormNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueFormNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
