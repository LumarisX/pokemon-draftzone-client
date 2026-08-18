import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

@Component({
  selector: 'pdz-confirm-delete-dialog',
  template: `
    <h1 mat-dialog-title>Delete Matchup</h1>
    <div mat-dialog-content>
      <p>Are you sure you want to delete this matchup?</p>
    </div>
    <div mat-dialog-actions>
      <button pdz-button variant="ghost" color="neutral" (click)="onNoClick()">No</button>
      <button pdz-button color="danger" [mat-dialog-close]="true" cdkFocusInitial>Yes</button>
    </div>
  `,
  imports: [MatDialogModule, ButtonComponent],
})
export class ConfirmDeleteDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
