import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LeagueTierGroup } from '../../../../interfaces/tier-pokemon.interface';

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
  styleUrls: ['./tier-group-edit-dialog.component.scss'],
})
export class TierGroupEditDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<TierGroupEditDialogComponent>>(MatDialogRef);
  data = inject<{
    tierGroup: LeagueTierGroup;
  }>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  dialogForm!: FormGroup;

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
