import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GuardsUnsavedChanges } from '@pdz/core/guards/unsaved-changes/unsaved-changes.guard';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { formatMilestoneTime } from '../tournament-milestones';
import { ApplicantsPanelComponent } from './applicants-panel.component';
import { SaveBarComponent } from './save-bar.component';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-signups-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ApplicantsPanelComponent,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    SaveBarComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './signups-page.component.html',
  styleUrl: './signups-page.component.scss',
})
export class SignupsPageComponent implements GuardsUnsavedChanges {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly dialog = inject(DialogService);

  protected readonly status = computed(() => {
    const saved = this.store.saved();
    if (saved.signUpAccess === 'closed') return 'Sign-ups are closed';
    const deadline = saved.signUpDeadline ? new Date(saved.signUpDeadline) : null;
    const how = saved.signUpAccess === 'invite' ? 'Invite link only' : 'Open';
    if (!deadline || Number.isNaN(deadline.getTime())) return how;
    return this.store.signUpsOpen()
      ? `${how} until ${formatMilestoneTime(deadline)}`
      : `Closed ${formatMilestoneTime(deadline)}`;
  });

  protected readonly counts = computed(() => {
    const counts = this.store.statusCounts();
    return [
      { label: 'pending', value: counts.pending },
      { label: 'approved', value: counts.approved },
      { label: 'waitlisted', value: counts.waitlisted },
      { label: 'denied', value: counts.denied },
    ].filter((entry) => entry.value > 0);
  });

  protected save(): void {
    this.store.saveApplicants().subscribe();
  }

  protected revert(): void {
    this.store.revertApplicants();
  }

  async canDeactivate(): Promise<boolean> {
    if (!this.store.applicantsDirtyCount()) return true;
    const leave = await this.dialog.confirm('Leave without saving?', {
      message: 'Your decisions on these applicants will be lost.',
      confirmLabel: 'Discard Changes',
      confirmColor: 'danger',
    });
    if (leave) this.store.revertApplicants();
    return leave;
  }
}
