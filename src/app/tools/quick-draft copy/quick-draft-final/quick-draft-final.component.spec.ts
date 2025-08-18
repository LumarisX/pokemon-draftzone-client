import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickDraftFinalComponent } from './quick-draft-final.component';

describe('QuickDraftFinalComponent', () => {
  let component: QuickDraftFinalComponent;
  let fixture: ComponentFixture<QuickDraftFinalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickDraftFinalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickDraftFinalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
