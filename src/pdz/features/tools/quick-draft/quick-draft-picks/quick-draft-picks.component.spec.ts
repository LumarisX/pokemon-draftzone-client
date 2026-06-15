import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickDraftPicksComponent } from './quick-draft-picks.component';

describe('QuickDraftOptionsComponent', () => {
  let component: QuickDraftPicksComponent;
  let fixture: ComponentFixture<QuickDraftPicksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickDraftPicksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickDraftPicksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
