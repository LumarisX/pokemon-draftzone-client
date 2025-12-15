import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonCardComponent } from './comparison-card.component';

describe('ComparisonCardComponent', () => {
  let component: ComparisonCardComponent;
  let fixture: ComponentFixture<ComparisonCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ComparisonCardComponent],
    });
    fixture = TestBed.createComponent(ComparisonCardComponent);
    component = fixture.componentInstance;
    component.entityLeft = { logoUrl: '', primaryName: '', secondaryName: '' };
    component.entityRight = { logoUrl: '', primaryName: '', secondaryName: '' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
