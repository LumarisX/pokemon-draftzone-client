import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftDashboardComponent } from './draft-dashboard.component';

describe('DraftDashboardComponent', () => {
  let component: DraftDashboardComponent;
  let fixture: ComponentFixture<DraftDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DraftDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DraftDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
