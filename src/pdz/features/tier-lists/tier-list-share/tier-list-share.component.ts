import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DIALOG_DATA, DialogRef, DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { ChoiceCardComponent } from '@pdz/shared/inputs/choice-cards/choice-card.component';
import { ChoiceCardsComponent } from '@pdz/shared/inputs/choice-cards/choice-cards.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldHintDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { TierListMembers, TierListRole, TierListVisibility } from '../tier-list.model';
import { TierListService } from '../tier-list.service';

export type ShareDialogData = {
  slug: string;
  name: string;
  visibility: TierListVisibility;
  authorName: string | null;
  canManage: boolean;
};

export type ShareDialogResult = {
  visibility: TierListVisibility;
  authorName: string | null;
  left?: boolean;
};

@Component({
  selector: 'pdz-tier-list-share',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    ButtonComponent,
    ChoiceCardComponent,
    ChoiceCardsComponent,
    EmptyStateComponent,
    FieldComponent,
    FieldHintDirective,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './tier-list-share.component.html',
  styleUrl: './tier-list-share.component.scss',
})
export class TierListShareComponent implements OnInit {
  protected readonly ref = inject(DialogRef) as DialogRef<ShareDialogResult>;
  protected readonly data = inject<ShareDialogData>(DIALOG_DATA);
  private readonly tierLists = inject(TierListService);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly clipboard = inject(Clipboard);

  protected readonly visibility = signal<TierListVisibility>(this.data.visibility);
  protected readonly authorName = signal(this.data.authorName ?? '');
  protected readonly savedVisibility = signal<TierListVisibility>(this.data.visibility);
  protected readonly savedAuthor = signal(this.data.authorName ?? '');
  protected readonly saving = signal(false);

  protected readonly members = signal<TierListMembers | null>(null);
  protected readonly membersFailed = signal(false);
  protected readonly inviteRole = signal<TierListRole>('editor');
  protected readonly inviteUses = signal(1);
  protected readonly creating = signal(false);
  protected readonly freshLink = signal<string | null>(null);
  protected readonly busy = signal<string | null>(null);

  protected readonly listLink = `${location.origin}/${TIER_LIST_PATH}/${this.data.slug}`;

  protected readonly needsAuthor = computed(
    () => this.visibility() !== 'private' && !this.authorName().trim(),
  );
  protected readonly dirty = computed(
    () =>
      this.visibility() !== this.savedVisibility() ||
      this.authorName().trim() !== this.savedAuthor(),
  );

  ngOnInit(): void {
    this.loadMembers();
  }

  protected loadMembers(): void {
    this.membersFailed.set(false);
    this.tierLists.members(this.data.slug).subscribe({
      next: (members) => this.members.set(members),
      error: () => this.membersFailed.set(true),
    });
  }

  protected saveVisibility(): void {
    if (this.needsAuthor() || this.saving()) return;
    this.saving.set(true);
    const authorName = this.authorName().trim();
    this.tierLists
      .updateSettings(
        {
          visibility: this.visibility(),
          ...(authorName && authorName !== this.savedAuthor() && { authorName }),
        },
        this.data.slug,
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.savedVisibility.set(this.visibility());
          this.savedAuthor.set(authorName);
          this.toasts.success('Sharing saved.');
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.error(apiErrorMessage(err, 'Could not save sharing.'));
        },
      });
  }

  protected copy(link: string): void {
    this.clipboard.copy(link);
    this.toasts.success('Link copied.');
  }

  protected createInvite(): void {
    this.creating.set(true);
    this.tierLists
      .createInvite(this.data.slug, this.inviteRole(), this.inviteUses())
      .subscribe({
        next: (invite) => {
          this.creating.set(false);
          const link = `${location.origin}/${TIER_LIST_PATH}/invite/${invite.token}`;
          this.freshLink.set(link);
          this.copy(link);
          this.loadMembers();
        },
        error: (err) => {
          this.creating.set(false);
          this.toasts.error(apiErrorMessage(err, 'Could not make an invite link.'));
        },
      });
  }

  protected revoke(inviteId: string): void {
    this.busy.set(inviteId);
    this.tierLists.revokeInvite(this.data.slug, inviteId).subscribe({
      next: () => {
        this.busy.set(null);
        this.loadMembers();
      },
      error: (err) => {
        this.busy.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not revoke that invite.'));
      },
    });
  }

  protected setRole(memberId: string, role: TierListRole): void {
    this.busy.set(memberId);
    this.tierLists.setRole(this.data.slug, memberId, role).subscribe({
      next: () => {
        this.busy.set(null);
        this.loadMembers();
      },
      error: (err) => {
        this.busy.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not change that role.'));
      },
    });
  }

  protected async remove(member: TierListMembers['members'][number]): Promise<void> {
    const leaving = member.you;
    const confirmed = await this.dialogs.confirm(
      leaving ? 'Leave this tier list?' : `Remove ${member.name ?? 'this person'}?`,
      {
        message: leaving
          ? "You'll lose access unless the list is public or someone invites you again."
          : 'They lose access to this list right away.',
        confirmLabel: leaving ? 'Leave' : 'Remove',
        confirmColor: 'danger',
      },
    );
    if (!confirmed) return;
    this.busy.set(member.id);
    this.tierLists.removeMember(this.data.slug, member.id).subscribe({
      next: (result) => {
        this.busy.set(null);
        this.toasts.success(result.message);
        if (leaving)
          this.ref.close({
            visibility: this.savedVisibility(),
            authorName: this.savedAuthor() || null,
            left: true,
          });
        else this.loadMembers();
      },
      error: (err) => {
        this.busy.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not remove them.'));
      },
    });
  }

  protected async transfer(member: TierListMembers['members'][number]): Promise<void> {
    const confirmed = await this.dialogs.confirm(
      `Hand ${this.data.name} to ${member.name ?? 'this editor'}?`,
      {
        message:
          'They become the owner and can delete it or change who sees it. You stay on as an editor.',
        confirmLabel: 'Hand It Over',
      },
    );
    if (!confirmed) return;
    this.busy.set(member.id);
    this.tierLists.transfer(this.data.slug, member.id).subscribe({
      next: (result) => {
        this.busy.set(null);
        this.toasts.success(result.message);
        this.close();
      },
      error: (err) => {
        this.busy.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not hand the list over.'));
      },
    });
  }

  protected close(): void {
    this.ref.close({
      visibility: this.savedVisibility(),
      authorName: this.savedAuthor() || null,
    });
  }
}
