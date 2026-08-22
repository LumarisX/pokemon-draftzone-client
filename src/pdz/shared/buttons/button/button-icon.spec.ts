import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <button pdz-button id="none">Plain</button>
    <button pdz-button icon="add" id="leading">New draft</button>
    <button pdz-button iconOnly icon="add" aria-label="New draft" id="only">
    </button>
    <button pdz-button icon="add" [size]="size()" id="sized">Sized</button>
  `,
})
class HostComponent {
  size = signal<'sm' | 'md' | 'lg'>('md');
}

describe('pdz-button icon', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    return f;
  }

  function query(f: ReturnType<typeof render>, id: string) {
    return (f.nativeElement as HTMLElement).querySelector(`#${id}`)!;
  }

  it('renders no icon when the input is unset', () => {
    expect(query(render(), 'none').querySelector('pdz-icon')).toBeNull();
  });

  it('renders the icon ahead of the projected label', () => {
    const content = query(render(), 'leading').querySelector(
      '.pdz-btn__content',
    )!;
    expect(content.firstElementChild!.tagName.toLowerCase()).toBe('pdz-icon');
    expect(content.lastChild!.textContent).toBe('New draft');
  });

  it('hides the icon from assistive tech so the aria-label wins', () => {
    const icon = query(render(), 'only').querySelector('pdz-icon')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('scales the icon with the button size', () => {
    const f = render();
    const glyph = () =>
      query(f, 'sized').querySelector('.material-symbols-outlined')!;
    expect((glyph() as HTMLElement).style.fontSize).toBe('18px');

    f.componentInstance.size.set('sm');
    f.detectChanges();
    expect((glyph() as HTMLElement).style.fontSize).toBe('16px');

    f.componentInstance.size.set('lg');
    f.detectChanges();
    expect((glyph() as HTMLElement).style.fontSize).toBe('20px');
  });
});
