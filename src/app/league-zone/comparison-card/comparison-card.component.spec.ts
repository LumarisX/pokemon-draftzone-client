import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonCardComponent } from './comparison-card.component';

describe('ComparisonCardComponent', () => {
  let component: ComparisonCardComponent;
  let fixture: ComponentFixture<ComparisonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparisonCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
