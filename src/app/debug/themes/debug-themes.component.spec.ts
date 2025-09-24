import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugThemesComponent } from './debug-themes.component';

describe('DebugThemesComponent', () => {
  let component: DebugThemesComponent;
  let fixture: ComponentFixture<DebugThemesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DebugThemesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DebugThemesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the theme', () => {
    component.setTheme('dark');
    expect(component.theme).toBe('dark');
  });

  it('should set the mode', () => {
    component.setMode('dark');
    expect(component.mode).toBe('dark');
  });
});