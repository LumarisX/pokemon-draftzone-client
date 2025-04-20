import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { LeagueTierGroup } from '../../../../services/battle-zone.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'pdz-tier-group-edit-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './tier-group-edit-dialog.component.html',
  styleUrl: './tier-group-edit-dialog.component.scss',
})
export class TierGroupEditDialogComponent implements OnInit {
  dialogForm!: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<TierGroupEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      tierGroup: LeagueTierGroup;
    },
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.dialogForm = this.fb.group({
      groupLabel: [this.data.tierGroup.label, Validators.required],
    });
  }

  onSave(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
