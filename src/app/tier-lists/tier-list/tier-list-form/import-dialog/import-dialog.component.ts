import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface ImportColumn {
  csvHeader: string;
  preview: string[];
}

export interface ImportDialogData {
  columns: ImportColumn[];
  availableTiers: string[];
  untieredName: string;
  bannedName: string;
}

export type ImportDialogResult = (string | null)[];

const EXCLUDE = '__EXCLUDE__';
const NEW_TIER = '__NEW_TIER__';

@Component({
  selector: 'pdz-import-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class ImportDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ImportDialogComponent>>(MatDialogRef);
  data = inject<ImportDialogData>(MAT_DIALOG_DATA);

  readonly EXCLUDE = EXCLUDE;
  readonly NEW_TIER = NEW_TIER;

  columnMappings: string[] = [];

  get tierOptions(): { label: string; value: string }[] {
    return [
      ...this.data.availableTiers.map((t) => ({ label: t, value: t })),
      { label: this.data.untieredName, value: this.data.untieredName },
      { label: this.data.bannedName, value: this.data.bannedName },
    ];
  }

  ngOnInit(): void {
    this.columnMappings = this.data.columns.map((col) => {
      const all = [
        ...this.data.availableTiers,
        this.data.untieredName,
        this.data.bannedName,
      ];
      const match = all.find(
        (t) => t.toLowerCase() === col.csvHeader.toLowerCase(),
      );
      return match ?? this.data.untieredName;
    });
  }

  onImport(): void {
    const result: ImportDialogResult = this.columnMappings.map((m, i) => {
      if (m === EXCLUDE) return null;
      if (m === NEW_TIER) return NEW_TIER + this.data.columns[i].csvHeader;
      return m;
    });
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
