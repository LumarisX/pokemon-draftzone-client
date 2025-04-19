import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LeagueTierGroup } from '../../../../services/battle-zone.service';

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
  constructor(
    public dialogRef: MatDialogRef<TierEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      tierGroup: LeagueTierGroup;
    },
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {}

  onSave(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
