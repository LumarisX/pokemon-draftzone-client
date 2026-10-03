import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAuthStub } from '@pdz/core/testing/auth-stub';
import { QuickDraftFinalComponent } from './quick-draft-final.component';

describe('QuickDraftFinalComponent', () => {
  let component: QuickDraftFinalComponent;
  let fixture: ComponentFixture<QuickDraftFinalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickDraftFinalComponent],
      providers: [
        provideAuthStub(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickDraftFinalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', []);
    fixture.componentRef.setInput('settings', {
      rerolls: 0,
      tiers: [],
      format: 'Singles',
      ruleset: 'Gen9 NatDex',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
