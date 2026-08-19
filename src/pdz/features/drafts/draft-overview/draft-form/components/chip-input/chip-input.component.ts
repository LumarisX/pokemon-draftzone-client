import { Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

@Component({
  selector: 'pdz-chip-input',
  imports: [IconComponent],
  templateUrl: './chip-input.component.html',
  styleUrl: './chip-input.component.scss',
})
export class ChipInputComponent {
  readonly control = input.required<FormControl<string[]>>();
  readonly label = input('');
  readonly placeholder = input('Add...');

  inputValue = '';

  add(input: HTMLInputElement): void {
    const value = input.value.trim();
    const control = this.control();
    if (value && !control.value.includes(value)) {
      control.setValue([...control.value, value]);
    }
    input.value = '';
  }

  remove(index: number): void {
    const updated = [...this.control().value];
    updated.splice(index, 1);
    this.control().setValue(updated);
  }

  handleKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.add(input);
    } else if (event.key === 'Backspace' && !input.value) {
      const chips = this.control().value;
      if (chips.length) this.remove(chips.length - 1);
    }
  }
}
