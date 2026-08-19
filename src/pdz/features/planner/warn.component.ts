import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

@Component({
  selector: 'pdz-dialog-animations-example-dialog',
  template: `<h2 mat-dialog-title>Planner limit reached</h2>
    <mat-dialog-content>
      Please delete a draft plan before continuing.
    </mat-dialog-content>
    <mat-dialog-actions>
      <button pdz-button mat-dialog-close cdkFocusInitial>Ok</button>
    </mat-dialog-actions>`,
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    ButtonComponent,
  ],
  styles: `
    @use '@angular/material' as mat;
    mat-dialog-container {
      @include mat.dialog-overrides(
        (
          container-color: orange,
          subhead-color: red,
        )
      );
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerSizeWarn {
  readonly dialogRef = inject(MatDialogRef<PlannerSizeWarn>);
}
