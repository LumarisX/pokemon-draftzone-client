import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { LogoFieldComponent } from './logo-field.component';
import { PoolOrderComponent } from './pool-order.component';
import {
  AnyControlSpec,
  PrizeShare,
  SIGNUP_QUESTION_TYPE_OPTIONS,
  SignUpQuestionValue,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';
import { LeagueZoneService } from '../league-zone.service';
import {
  DiscordLinkCode,
  LeagueManageService,
} from '../league-manage/league-manage.service';
import { BadgeComponent } from '@pdz/shared/data/badge/badge.component';
import { DatePipe } from '@angular/common';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { TierListPanelComponent } from './tier-list-panel.component';

@Component({
  selector: 'pdz-custom-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    BadgeComponent,
    DatePipe,
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    FieldComponent,
    IconComponent,
    SelectComponent,
    SelectOptionComponent,
    InputDirective,
    LogoFieldComponent,
    PoolOrderComponent,
    TierListPanelComponent,
  ],
  templateUrl: './custom-slot.component.html',
  styleUrl: './custom-slot.component.scss',
})
export class CustomSlotComponent {
  readonly control = input.required<AnyControlSpec>();
  readonly disabled = input(false);
  readonly poolId = input<string | null>(null);

  protected readonly store = inject(TournamentSettingsStore);
  private readonly league = inject(LeagueZoneService);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);

  protected readonly slot = computed(() => {
    const control = this.control();
    return control.kind === 'custom' ? control.slot : null;
  });

  protected readonly signUpChannelId = computed(() =>
    this.store.read<string>('discordSignUpChannelId'),
  );

  private readonly manage = inject(LeagueManageService);
  protected readonly discordLink = this.store.discordLink;
  protected readonly linkCode = signal<DiscordLinkCode | null>(null);
  protected readonly linkBusy = signal(false);

  protected createLinkCode(): void {
    this.linkBusy.set(true);
    this.manage.createDiscordLinkCode().subscribe({
      next: (code) => {
        this.linkCode.set(code);
        this.linkBusy.set(false);
      },
      error: (err) => {
        this.toast.error(apiErrorMessage(err, 'Could not create a link code.'));
        this.linkBusy.set(false);
      },
    });
  }

  protected async copyLinkCommand(command: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      this.toast.success('Command copied.');
    } catch {
      this.toast.error('Could not copy the command.');
    }
  }

  protected checkLink(): void {
    const before = this.discordLink();
    this.linkBusy.set(true);
    this.store.refreshDiscordLink().subscribe({
      next: (link) => {
        this.linkBusy.set(false);
        const changed =
          !!link && (link.guildId !== before?.guildId || !before?.verified);
        if (changed) {
          this.linkCode.set(null);
          this.toast.success(`Linked to ${link.guildName ?? link.guildId}.`);
        } else {
          this.toast.info(
            'Not linked yet. Run the command in your Discord server first.',
          );
        }
      },
      error: (err) => {
        this.linkBusy.set(false);
        this.toast.error(apiErrorMessage(err, 'Could not check the link.'));
      },
    });
  }

  protected async unlinkDiscord(): Promise<void> {
    const confirmed = await this.dialogs.confirm('Unlink this Discord server?', {
      message:
        'DraftZone stops posting sign-ups and picks and granting the coach role there. The coach role and every channel are cleared, so you will pick them again after relinking.',
      confirmLabel: 'Unlink',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.linkBusy.set(true);
    this.store.unlinkDiscord().subscribe({
      next: () => {
        this.linkBusy.set(false);
        this.linkCode.set(null);
        this.toast.success('Discord server unlinked.');
      },
      error: (err) => {
        this.linkBusy.set(false);
        this.toast.error(apiErrorMessage(err, 'Could not unlink the server.'));
      },
    });
  }

  protected readonly questionTypes = SIGNUP_QUESTION_TYPE_OPTIONS;

  protected readonly questions = computed(
    () => this.store.read<SignUpQuestionValue[]>('signUpQuestions') ?? [],
  );

  protected dependencyChoices(
    questionId: string,
  ): { id: string; label: string }[] {
    return this.questions()
      .filter(
        (question) =>
          question.id !== questionId &&
          question.type === 'boolean' &&
          !question.archived,
      )
      .map((question) => ({
        id: question.id,
        label: question.label || 'Untitled question',
      }));
  }

  private writeQuestions(next: SignUpQuestionValue[]): void {
    this.store.write('signUpQuestions', next);
  }

  protected addQuestion(): void {
    this.writeQuestions([
      ...this.questions(),
      {
        id: `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        label: '',
        help: '',
        type: 'short',
        options: [],
        required: false,
        maxLength: null,
        dependsOnQuestionId: null,
        dependsOnEquals: '',
        archived: false,
      },
    ]);
  }

  protected patchQuestion(
    id: string,
    changes: Partial<SignUpQuestionValue>,
  ): void {
    this.writeQuestions(
      this.questions().map((question) =>
        question.id === id ? { ...question, ...changes } : question,
      ),
    );
  }

  protected optionsText(question: SignUpQuestionValue): string {
    return question.options.join('\n');
  }

  protected setOptions(id: string, raw: string): void {
    this.patchQuestion(id, {
      options: raw
        .split('\n')
        .map((option) => option.trim())
        .filter((option) => option.length > 0),
    });
  }

  protected setDependency(id: string, questionId: string): void {
    this.patchQuestion(id, {
      dependsOnQuestionId: questionId || null,
      dependsOnEquals: questionId ? 'true' : '',
    });
  }

  protected toggleArchived(id: string): void {
    const question = this.questions().find((entry) => entry.id === id);
    if (!question) return;
    this.patchQuestion(id, {
      archived: !question.archived,
      ...(question.archived
        ? {}
        : { dependsOnQuestionId: null, dependsOnEquals: '' }),
    });
    if (!question.archived) this.detachDependents(id);
  }

  private detachDependents(questionId: string): void {
    this.writeQuestions(
      this.questions().map((question) =>
        question.dependsOnQuestionId === questionId
          ? { ...question, dependsOnQuestionId: null, dependsOnEquals: '' }
          : question,
      ),
    );
  }

  protected readonly inviteMode = computed(
    () => this.store.read<string>('signUpAccess') === 'invite',
  );

  protected readonly inviteUrl = computed(() => {
    const token = this.store.signUpToken();
    if (!token) return null;
    const leagueSlug = this.league.leagueSlug();
    const tournamentSlug = this.league.tournamentSlug();
    return `${window.location.origin}/leagues/${leagueSlug}/tournaments/${tournamentSlug}/sign-up?invite=${token}`;
  });

  protected async copyInvite(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.toast.success('Invite link copied.');
    } catch {
      this.toast.error('Could not copy the link.');
    }
  }

  protected async rotateInvite(): Promise<void> {
    const confirmed = await this.dialogs.confirm('Rotate the invite link?', {
      message:
        'Every link you have already sent stops working immediately. Anyone mid-signup will have to start again with the new link.',
      confirmLabel: 'Rotate',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.league.rotateSignUpToken().subscribe({
      next: ({ signUpToken }) => {
        this.store.setSignUpToken(signUpToken);
        this.toast.success('Invite link rotated.');
      },
      error: (err) => {
        this.toast.error(apiErrorMessage(err, 'Could not rotate the link.'));
      },
    });
  }

  protected readonly poolChannelId = computed(() =>
    this.store.read<string>('channelId', this.poolId()),
  );

  protected readonly draftStart = computed(() =>
    this.store.read<string>('draftStart', this.poolId()),
  );

  protected readonly draftEnd = computed(() =>
    this.store.read<string>('draftEnd', this.poolId()),
  );

  protected readonly multiPool = computed(() => this.store.poolCount() > 1);

  protected readonly prizeSplit = computed(() =>
    this.store.read<PrizeShare[]>('prizeSplit'),
  );

  protected readonly prizeTotal = computed(() =>
    this.prizeSplit().reduce((sum, share) => sum + share.percent, 0),
  );

  protected setPoolValue(key: string, value: string): void {
    this.store.write(key, value, this.poolId());
  }

  protected applyWindowToAll(): void {
    const id = this.poolId();
    if (id) this.store.applyWindowToAllPools(id);
  }

  protected setSignUpChannel(value: string): void {
    this.store.write('discordSignUpChannelId', value);
  }

  protected setPercent(index: number, value: number): void {
    this.store.write(
      'prizeSplit',
      this.prizeSplit().map((share, position) =>
        position === index
          ? { ...share, percent: Math.max(0, Number(value) || 0) }
          : share,
      ),
    );
  }

  protected addShare(): void {
    const current = this.prizeSplit();
    this.store.write('prizeSplit', [
      ...current,
      { place: current.length + 1, percent: 0 },
    ]);
  }

  protected removeShare(index: number): void {
    this.store.write(
      'prizeSplit',
      this.prizeSplit()
        .filter((_, position) => position !== index)
        .map((share, position) => ({ ...share, place: position + 1 })),
    );
  }
}
