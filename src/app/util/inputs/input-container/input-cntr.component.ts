import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChild,
  Input,
} from '@angular/core';
import { AbstractControl, NgControl } from '@angular/forms';
import { forwardRef } from '@angular/core';

@Component({
  selector: 'input-cntr',
  standalone: true,
  imports: [CommonModule, forwardRef(() => ErrorDisplayComponent)],
  templateUrl: './input-cntr.component.html',
  styleUrl: './input-cntr.component.scss',
})
export class InputContainerComponent implements AfterContentInit {
  @Input() label: string | undefined;
  @ContentChild(NgControl) control: NgControl | undefined;

  ngAfterContentInit() {
    if (!this.control) {
      // console.error('No form control found for app-input-container.');
    }
  }
}

@Component({
  selector: 'app-error-display',
  template: `
    <div *ngIf="control?.errors && (control?.dirty || control?.touched)">
      <span *ngIf="control?.hasError('required')">This field is required.</span>
      <span *ngIf="control?.hasError('email')"
        >Please enter a valid email address.</span
      >
      <!-- Add more error messages as needed -->
    </div>
  `,
  styles: [
    `
      div {
        color: #f44336; /* Red color for errors */
        font-size: 12px;
        margin-top: 4px;
      }
    `,
  ],
  imports: [CommonModule],
})
export class ErrorDisplayComponent {
  @Input() control: AbstractControl | null = null;
}
