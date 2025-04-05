import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueTierListComponent } from './league-tier-list.component';

describe('LeagueTierListComponent', () => {
  let component: LeagueTierListComponent;
  let fixture: ComponentFixture<LeagueTierListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueTierListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueTierListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
