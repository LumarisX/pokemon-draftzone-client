import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickDraftPicksComponent } from './quick-draft-picks.component';

describe('QuickDraftPicksComponent', () => {
  let component: QuickDraftPicksComponent;
  let fixture: ComponentFixture<QuickDraftPicksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickDraftPicksComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickDraftPicksComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('settings', {
      rerolls: 1,
      tiers: [
        ['OU', 2],
        ['UU', 1],
      ],
      format: 'Singles',
      ruleset: 'Gen9 NatDex',
    });
    fixture.detectChanges();
  });

  it('opens one empty slot per pick across all tiers', () => {
    expect(component.totalPicks).toBe(3);
    expect(component.draft.length).toBe(3);
  });
});
