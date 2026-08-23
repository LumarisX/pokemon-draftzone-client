import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';

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
    FormsModule,
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class ImportDialogComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<ImportDialogResult>;
  data = inject<ImportDialogData>(DIALOG_DATA);

  readonly EXCLUDE = EXCLUDE;
  readonly NEW_TIER = NEW_TIER;

  readonly tierOptions: { label: string; value: string }[] = [
    ...this.data.availableTiers.map((tier) => ({ label: tier, value: tier })),
    { label: this.data.untieredName, value: this.data.untieredName },
    { label: this.data.bannedName, value: this.data.bannedName },
  ];

  columnMappings: string[] = this.data.columns.map((column) => {
    const match = this.tierOptions.find(
      (option) =>
        option.value.toLowerCase() === column.csvHeader.toLowerCase().trim(),
    );
    return match?.value ?? this.data.untieredName;
  });

  onImport(): void {
    this.ref.close(
      this.columnMappings.map((mapping, index) => {
        if (mapping === EXCLUDE) return null;
        if (mapping === NEW_TIER)
          return NEW_TIER + this.data.columns[index].csvHeader;
        return mapping;
      }),
    );
  }
}
