import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { TeamIdentityPickerComponent } from '@pdz/features/league-zone/team-identity/team-identity-picker.component';
import {
  TeamIdentityChoice,
  isChoiceComplete,
} from '@pdz/features/league-zone/team-identity/team-identity.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';

export interface TeamEditDialogData {
  baseName: string;
  logo: string | null;
  showSaved?: boolean;
}

export type TeamEditDialogResult = TeamIdentityChoice;

@Component({
  selector: 'pdz-team-edit-dialog',
  imports: [ButtonComponent, TeamIdentityPickerComponent],
  templateUrl: './team-edit-dialog.component.html',
  styleUrl: './team-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamEditDialogComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<TeamEditDialogResult>;
  protected readonly data = inject<TeamEditDialogData>(DIALOG_DATA);

  protected readonly identity = signal<TeamIdentityChoice | null>({
    source: 'custom',
    name: this.data.baseName,
    logo: this.data.logo,
  });

  protected readonly missing = signal(false);

  protected save(): void {
    const identity = this.identity();
    if (!isChoiceComplete(identity)) {
      this.missing.set(true);
      return;
    }
    this.ref.close(identity);
  }
}
