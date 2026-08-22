import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  Type,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DialogComponent } from './dialog.component';
import { DialogRef } from './dialog.service';

@Component({
  selector: 'pdz-dialog-host',
  imports: [NgComponentOutlet, DialogComponent],
  template: `
    <pdz-dialog
      [open]="open()"
      [heading]="config().heading"
      [subheading]="config().subheading"
      [size]="config().size ?? 'md'"
      [dismissible]="config().dismissible ?? true"
      (closed)="dismissed.emit()"
    >
      <ng-container *ngComponentOutlet="component(); injector: injector" />
    </pdz-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHostComponent {
  component = input.required<Type<unknown>>();

  dismissed = output<void>();

  protected readonly open = signal(true);
  protected readonly injector = inject(Injector);
  protected readonly config = inject(DialogRef).config;

  dismiss() {
    this.open.set(false);
  }
}
