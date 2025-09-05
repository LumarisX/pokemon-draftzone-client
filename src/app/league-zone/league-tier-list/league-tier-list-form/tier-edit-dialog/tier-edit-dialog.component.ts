import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LeagueTierGroup } from '../../../league-sign-up/league-sign-up.component';

@Component({
  selector: 'pdz-tier-edit-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './tier-edit-dialog.component.html',
  styleUrl: './tier-edit-dialog.component.scss',
})
export class TierEditDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<TierEditDialogComponent>>(MatDialogRef);
  data = inject<{
    tierGroup: LeagueTierGroup;
  }>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  ngOnInit(): void {}

  onSave(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
