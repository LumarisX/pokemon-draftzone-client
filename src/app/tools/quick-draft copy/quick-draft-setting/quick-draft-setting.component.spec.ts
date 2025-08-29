import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickDraftSettingComponent } from './quick-draft-setting.component';

describe('QuickDraftSettingComponent', () => {
  let component: QuickDraftSettingComponent;
  let fixture: ComponentFixture<QuickDraftSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickDraftSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickDraftSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
