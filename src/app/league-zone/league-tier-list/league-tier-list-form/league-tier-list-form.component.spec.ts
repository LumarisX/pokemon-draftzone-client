import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueTierListFormComponent } from './league-tier-list-form.component';

describe('LeagueTierListFormComponent', () => {
  let component: LeagueTierListFormComponent;
  let fixture: ComponentFixture<LeagueTierListFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueTierListFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueTierListFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
