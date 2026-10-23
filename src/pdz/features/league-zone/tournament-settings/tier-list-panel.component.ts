import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TIER_LIST_PATH, TOURNAMENT_LOG_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { tierListBase } from '@pdz/features/tier-lists/tier-list-links';
import {
  PickedTierList,
  TierListPickerComponent,
  TierListPickerData,
} from '@pdz/features/tier-lists/tier-list-picker/tier-list-picker.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { LeagueZoneService } from '../league-zone.service';
import { TierRequirement } from './settings-schema';
import {
  BlankDialogData,
  TierListBlankDialogComponent,
} from './tier-list-blank-dialog.component';
import {
  PullDialogData,
  TierListPullDialogComponent,
} from './tier-list-pull-dialog.component';
import {
  SwapDialogData,
  TierListSwapDialogComponent,
} from './tier-list-swap-dialog.component';
import { TournamentSettingsStore } from './tournament-settings.store';
import { TournamentTierListService } from './tournament-tier-list.service';

interface RequirementRow {
  tierId: string;
  name: string;
  cost: number;
  required: number;
  max: number | null;
}

@Component({
  selector: 'pdz-tier-list-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    IconComponent,
    InputDirective,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    RouterLink,
  ],
  templateUrl: './tier-list-panel.component.html',
  styleUrl: './tier-list-panel.component.scss',
})
export class TierListPanelComponent {
  private readonly store = inject(TournamentSettingsStore);
  private readonly league = inject(LeagueZoneService);
  private readonly dialogs = inject(DialogService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly tournamentTierList = inject(TournamentTierListService);

  readonly disabled = input(false);

  protected readonly saving = signal(false);

  protected readonly links = computed(() => {
    const base = tierListBase(this.league, this.tierList().slug);
    return {
      view: base,
      edit: [...base, 'edit'],
      import: [...base, 'import'],
      history: [...base, 'history'],
      log: [...base.slice(0, -1), TOURNAMENT_LOG_PATH],
    };
  });

  protected readonly tierList = computed(() => this.store.artifacts().tierList);
  protected readonly attached = computed(() => this.tierList().name !== null);
  protected readonly source = computed(() => this.tierList().meta?.copiedFrom ?? null);
  protected readonly behind = computed(() => !!this.source()?.behind);

  protected readonly rows = computed<RequirementRow[]>(() => {
    const requirements = this.store.read<TierRequirement[]>('tierRequirements');
    return this.tierList().tiers.map((tier) => {
      const match = requirements.find((entry) => entry.tierId === tier.id);
      return {
        tierId: tier.id,
        name: tier.name,
        cost: tier.cost,
        required: match?.required ?? 0,
        max: match?.max ?? null,
      };
    });
  });

  protected readonly requiredTotal = computed(() =>
    this.rows().reduce((sum, row) => sum + row.required, 0),
  );

  protected readonly rosterMax = computed(() =>
    this.store.read<number>('draftCountMax'),
  );

  protected readonly overBudget = computed(
    () => this.requiredTotal() > this.rosterMax(),
  );

  protected setRequired(tierId: string, value: number): void {
    this.patch(tierId, { required: Math.max(0, Number(value) || 0) });
  }

  protected setMax(tierId: string, value: string): void {
    this.patch(tierId, {
      max: value === '' ? null : Math.max(0, Number(value) || 0),
    });
  }

  private patch(tierId: string, patch: Partial<TierRequirement>): void {
    const current = this.store.read<TierRequirement[]>('tierRequirements');
    const exists = current.some((entry) => entry.tierId === tierId);
    const next = exists
      ? current.map((entry) =>
          entry.tierId === tierId ? { ...entry, ...patch } : entry,
        )
      : [...current, { tierId, required: 0, max: null, ...patch }];
    this.store.write('tierRequirements', next);
  }

  private refresh(): void {
    this.store.refreshTierList().subscribe({
      error: () => this.toasts.error('The tier list changed, but it did not reload. Refresh to see it.'),
    });
  }

  private async unsavedRequirementsOk(): Promise<boolean> {
    if (!this.store.dirtyKeys().includes('tierRequirements')) return true;
    return this.dialogs.confirm('Discard unsaved requirements?', {
      message: 'Changing the tier list resets tier requirements to what is saved.',
      confirmLabel: 'Continue',
      confirmColor: 'danger',
    });
  }

  protected async choose(): Promise<void> {
    if (!(await this.unsavedRequirementsOk())) return;
    const replacing = this.attached();
    const picked = await this.dialogs.open<
      TierListPickerComponent,
      PickedTierList,
      TierListPickerData
    >(TierListPickerComponent, {
      heading: replacing ? 'Replace the Tier List' : 'Start From a Tier List',
      size: 'md',
      data: {
        intro: 'The tournament gets its own copy. Edits to the original never change it.',
      },
    }).closed;
    if (!picked) return;

    const done = await this.dialogs.open<TierListSwapDialogComponent, boolean, SwapDialogData>(
      TierListSwapDialogComponent,
      {
        heading: replacing ? `Replace With ${picked.name}?` : `Use ${picked.name}?`,
        size: 'lg',
        data: { slug: picked.slug, name: picked.name, replacing },
      },
    ).closed;
    if (done) this.refresh();
  }

  protected async buildOne(): Promise<void> {
    const created = await this.dialogs.open<
      TierListBlankDialogComponent,
      boolean,
      BlankDialogData
    >(TierListBlankDialogComponent, {
      heading: 'Build a Tier List',
      subheading: 'Choose what it is for. You place the Pokémon next.',
      size: 'sm',
      data: { tournamentName: this.store.read<string>('name') },
    }).closed;
    if (!created) return;
    this.refresh();
    this.router.navigate(this.links().edit);
  }

  protected async pull(): Promise<void> {
    const version = this.tierList().meta?.version ?? 0;
    const pulled = await this.dialogs.open<TierListPullDialogComponent, boolean, PullDialogData>(
      TierListPullDialogComponent,
      {
        heading: `Changes From ${this.source()?.name ?? 'the Source'}`,
        size: 'lg',
        data: { version },
      },
    ).closed;
    if (pulled) this.refresh();
  }

  protected saveAsPreset(): void {
    const name = this.tierList().name;
    if (!name || this.saving()) return;
    this.saving.set(true);
    this.tournamentTierList.saveAsPreset(name).subscribe({
      next: (preset) => {
        this.saving.set(false);
        this.toasts.show({
          title: 'Saved to My Tier Lists',
          message: `${preset.name} is now a private list you can reuse next season.`,
          tone: 'success',
          action: {
            label: 'Open It',
            run: () => this.router.navigate(['/', TIER_LIST_PATH, preset.slug]),
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.toasts.error(apiErrorMessage(err, 'Could not save it as a preset.'));
      },
    });
  }
}
