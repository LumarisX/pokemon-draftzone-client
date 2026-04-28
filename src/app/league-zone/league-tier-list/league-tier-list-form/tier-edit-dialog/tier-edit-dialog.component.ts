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

export interface TierDialogData {
  tier?: { name: string; cost?: number; required?: number };
}

export interface TierDialogResult {
  name: string;
  cost: number;
  required: number;
}

@Component({
  selector: 'pdz-tier-edit-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './tier-edit-dialog.component.html',
  styleUrls: ['./tier-edit-dialog.component.scss'],
})
export class TierEditDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<TierEditDialogComponent>>(MatDialogRef);
  data = inject<TierDialogData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  isAddMode = !this.data?.tier;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        this.data?.tier?.name ?? '',
        [Validators.required, Validators.maxLength(30)],
      ],
      cost: [this.data?.tier?.cost ?? null, Validators.required],
      required: [this.data?.tier?.required ?? 0, Validators.required],
    });

    this.form.get('name')!.valueChanges.subscribe((value: string) => {
      const num = Number(value?.trim());
      if (value?.trim() !== '' && !isNaN(num) && isFinite(num)) {
        this.form.get('cost')!.setValue(num, { emitEvent: false });
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) return;
    const { name, cost, required } = this.form.value;
    const result: TierDialogResult = {
      name: name.trim(),
      cost: Number(cost),
      required: Number(required),
    };
    this.dialogRef.close(result);
  }

  closeDialog(): void {
    this.dialogRef.close(null);
  }
}
