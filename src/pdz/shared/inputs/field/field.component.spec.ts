import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';
import { FieldErrorDirective } from './field-message.directive';
import { InputDirective } from './input.directive';

@Component({
  standalone: true,
  imports: [FieldComponent, FieldErrorDirective, InputDirective],
  template: `
    <label pdz-field label="Team Name" hint="Shown publicly" required>
      <input pdz-input id="named" />
      @if (showError()) {
        <span pdz-error id="projected-error">Required</span>
      }
    </label>

    <label pdz-field>
      <input pdz-input id="unlabelled" />
    </label>

    <div pdz-field label="Team Logo" id="group">
      <input pdz-input id="grouped" />
    </div>
  `,
})
class HostComponent {
  readonly showError = signal(false);
}

describe('pdz-field accessibility wiring', () => {
  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      query: (selector: string) => root.querySelector(selector)!,
    };
  }

  it('names the control from the label text only', () => {
    const { query } = render();
    const labelId = query('#named').getAttribute('aria-labelledby');

    expect(labelId).toBeTruthy();
    expect(query(`#${labelId}`).textContent).toContain('Team Name');
  });

  it('describes the control with the hint', () => {
    const { query } = render();
    const describedBy = query('#named').getAttribute('aria-describedby')!;

    expect(describedBy).toBeTruthy();
    expect(query(`#${describedBy}`).textContent).toContain('Shown publicly');
  });

  it('adds a projected error to aria-describedby when it appears', () => {
    const { fixture, query } = render();
    fixture.componentInstance.showError.set(true);
    fixture.detectChanges();

    const ids = query('#named').getAttribute('aria-describedby')!.split(' ');

    expect(ids).toContain('projected-error');
    expect(query('#projected-error').getAttribute('role')).toBe('alert');
  });

  it('leaves the implicit label alone when no label text is set', () => {
    const { query } = render();

    expect(query('#unlabelled').hasAttribute('aria-labelledby')).toBe(false);
  });

  it('exposes a non-label field as a labelled group', () => {
    const { query } = render();
    const group = query('#group');

    expect(group.getAttribute('role')).toBe('group');
    expect(query(`#${group.getAttribute('aria-labelledby')}`).textContent)
      .toContain('Team Logo');
  });

  it('does not put a group role on a label field', () => {
    const { query } = render();

    expect(query('label[pdz-field]').hasAttribute('role')).toBe(false);
  });
});
