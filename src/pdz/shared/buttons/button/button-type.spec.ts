import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <button pdz-button id="implicit">Default</button>
    <button pdz-button type="submit" id="submit">Save</button>
    <button pdz-button type="reset" id="reset">Reset</button>
    <a pdz-button href="/x" id="anchor">Link</a>
  `,
})
class HostComponent {}

describe('pdz-button type', () => {
  function render() {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    return (id: string) =>
      (f.nativeElement as HTMLElement).querySelector(`#${id}`)!;
  }

  it('defaults a bare button to type="button"', () => {
    expect(render()('implicit').getAttribute('type')).toBe('button');
  });

  it('preserves a static type="submit"', () => {
    expect(render()('submit').getAttribute('type')).toBe('submit');
  });

  it('preserves a static type="reset"', () => {
    expect(render()('reset').getAttribute('type')).toBe('reset');
  });

  it('does not put a type attribute on an anchor', () => {
    expect(render()('anchor').hasAttribute('type')).toBe(false);
  });
});
