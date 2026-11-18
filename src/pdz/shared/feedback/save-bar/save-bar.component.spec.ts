import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SaveBarComponent } from './save-bar.component';

@Component({
  imports: [SaveBarComponent],
  template: `<pdz-save-bar
    [count]="count()"
    [blocked]="blocked()"
    [pending]="pending()"
    [error]="error()"
    label="Save Changes"
    (save)="saves = saves + 1"
    (revert)="reverts = reverts + 1"
  />`,
})
class HostComponent {
  count = signal(0);
  blocked = signal(false);
  pending = signal(false);
  error = signal<string | null>(null);
  saves = 0;
  reverts = 0;
}

describe('SaveBarComponent', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const buttons = () =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('button'));
    const button = (label: string) =>
      buttons().find((candidate) => candidate.textContent?.includes(label))!;
    return { fixture, host: fixture.componentInstance, el, button };
  }

  it('renders nothing while clean', () => {
    const { el } = render();
    expect(el.querySelector('.bar')).toBeNull();
  });

  it('counts the changes', () => {
    const { fixture, host, el } = render();
    host.count.set(1);
    fixture.detectChanges();
    expect(el.textContent).toContain('1 unsaved change');
    expect(el.textContent).not.toContain('changes');
    host.count.set(3);
    fixture.detectChanges();
    expect(el.textContent).toContain('3 unsaved changes');
  });

  it('emits save and revert', () => {
    const { fixture, host, button } = render();
    host.count.set(2);
    fixture.detectChanges();
    button('Save Changes').click();
    button('Revert').click();
    expect(host.saves).toBe(1);
    expect(host.reverts).toBe(1);
  });

  it('disables save when blocked', () => {
    const { fixture, host, button } = render();
    host.count.set(2);
    host.blocked.set(true);
    fixture.detectChanges();
    expect(button('Save Changes').disabled).toBe(true);
    expect(button('Revert').disabled).toBe(false);
  });

  it('disables both and says Saving while pending', () => {
    const { fixture, host, button } = render();
    host.count.set(2);
    host.pending.set(true);
    fixture.detectChanges();
    expect(button('Saving').disabled).toBe(true);
    expect(button('Revert').disabled).toBe(true);
  });

  it('shows an error beside the status', () => {
    const { fixture, host, el } = render();
    host.count.set(2);
    host.error.set('Could not save.');
    fixture.detectChanges();
    expect(el.querySelector('.bar__error')?.textContent).toContain(
      'Could not save.',
    );
  });
});
