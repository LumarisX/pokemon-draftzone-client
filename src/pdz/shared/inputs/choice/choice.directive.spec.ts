import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChoiceDirective } from './choice.directive';

@Component({
  imports: [ChoiceDirective, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input pdz-checkbox type="checkbox" formControlName="flag" id="box" />
      <input
        pdz-radio
        type="radio"
        formControlName="mode"
        value="game"
        id="game"
      />
      <input
        pdz-radio
        type="radio"
        formControlName="mode"
        value="series"
        id="series"
      />
    </form>
  `,
})
class Host {
  form = new FormGroup({
    flag: new FormControl(false),
    mode: new FormControl('game'),
  });
}

describe('ChoiceDirective form integration', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  let host: Host;
  const el = (id: string) =>
    fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the type the directive declares', () => {
    expect(el('box').getAttribute('type')).toBe('checkbox');
    expect(el('game').getAttribute('type')).toBe('radio');
  });

  it('writes a real boolean when a checkbox is toggled', () => {
    expect(host.form.value.flag).toBe(false);

    el('box').checked = true;
    el('box').dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.form.value.flag).toBe(true);

    el('box').checked = false;
    el('box').dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.form.value.flag).toBe(false);
  });

  it('never lets a checkbox value become a string', () => {
    el('box').checked = true;
    el('box').dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(typeof host.form.value.flag).toBe('boolean');
  });

  it('reflects control writes back onto the checkbox', () => {
    host.form.controls.flag.setValue(true);
    fixture.detectChanges();
    expect(el('box').checked).toBe(true);
  });

  it('keeps radios grouped by control rather than by name', () => {
    expect(el('game').checked).toBe(true);
    expect(el('series').checked).toBe(false);

    el('series').checked = true;
    el('series').dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.form.value.mode).toBe('series');
    expect(el('game').checked).toBe(false);
  });
});
