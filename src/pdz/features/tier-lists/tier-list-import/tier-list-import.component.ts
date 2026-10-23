import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { DataService } from '@pdz/core/services/data.service';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { HelpComponent } from '@pdz/shared/help/help.component';
import { ChoiceCardComponent } from '@pdz/shared/inputs/choice-cards/choice-card.component';
import { ChoiceCardsComponent } from '@pdz/shared/inputs/choice-cards/choice-cards.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldHintDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { ImportPreview, LayoutId, LeagueTier, MatchOption, MatchStatus } from '../tier-list.model';
import { tierListBase } from '../tier-list-links';
import { TierListService } from '../tier-list.service';
import {
  allRows,
  ImportRow,
  initialResolutions,
  initialTiers,
  mergePayload,
  placements,
  rememberedChoices,
  replacePayload,
  Resolution,
  TierDraft,
} from './import-plan';

type Source = 'paste' | 'file' | 'link';
type Mode = 'replace' | 'merge';

type Target = {
  slug: string;
  name: string;
  format: string;
  ruleset: string;
  version: number;
  tiers: LeagueTier[];
  tournament: boolean;
};

const STATUS_LABEL: Record<MatchStatus, string> = {
  matched: 'Matched',
  suggested: 'Did You Mean',
  ambiguous: 'Which One',
  'not-in-ruleset': 'Not in Ruleset',
  unmatched: 'No Match',
};

const STATUS_TONE: Record<MatchStatus, ChipTone> = {
  matched: 'success',
  suggested: 'info',
  ambiguous: 'warning',
  'not-in-ruleset': 'danger',
  unmatched: 'danger',
};

@Component({
  selector: 'pdz-tier-list-import',
  imports: [
    FormsModule,
    ButtonComponent,
    CardComponent,
    CheckComponent,
    ChipComponent,
    ChoiceCardComponent,
    ChoiceCardsComponent,
    ChoiceDirective,
    EmptyStateComponent,
    FieldComponent,
    FieldHintDirective,
    HelpComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    PokemonComponent,
    PokemonSearchComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './tier-list-import.component.html',
  styleUrl: './tier-list-import.component.scss',
})
export class TierListImportComponent implements OnInit {
  private readonly tierLists = inject(TierListService);
  private readonly dataService = inject(DataService);
  private readonly toasts = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly league = inject(LeagueZoneService);

  protected readonly path = TIER_LIST_PATH;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statusTone = STATUS_TONE;

  private readonly routedSlug = this.route.snapshot.paramMap.get('tierListSlug');
  protected readonly inTournament = !!this.league.tournamentSlug();
  protected readonly intoExisting = !!this.routedSlug || this.inTournament;

  protected readonly target = signal<Target | null>(null);
  protected readonly targetFailed = signal(false);

  protected readonly source = signal<Source>('paste');
  protected readonly text = signal('');
  protected readonly url = signal('');
  protected readonly fileName = signal('');
  protected readonly format = signal('');
  protected readonly ruleset = signal('');

  protected readonly reading = signal(false);
  protected readonly readError = signal<string | null>(null);
  protected readonly preview = signal<ImportPreview | null>(null);
  protected readonly tiers = signal<TierDraft[]>([]);
  protected readonly resolutions = signal(new Map<string, Resolution>());
  protected readonly duplicateWinners = signal(new Map<string, number>());
  protected readonly remember = signal(true);
  protected readonly showMatched = signal(false);

  protected readonly listName = signal('');
  protected readonly mode = signal<Mode>('replace');
  protected readonly applying = signal(false);

  protected readonly formats = toSignal(
    this.dataService.getFormatsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );
  protected readonly rulesets = toSignal(
    this.dataService.getRulesetsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );

  protected readonly backLink = computed(() => {
    const target = this.target();
    if (this.intoExisting) return [...tierListBase(this.league, target?.slug), 'edit'];
    return ['/', TIER_LIST_PATH, 'new'];
  });

  protected readonly canRead = computed(() => {
    const hasInput =
      this.source() === 'link' ? !!this.url().trim() : !!this.text().trim();
    const hasRules = this.intoExisting
      ? !!this.target()
      : !!this.format() && !!this.ruleset();
    return hasInput && hasRules && !this.reading();
  });

  protected readonly rows = computed(() => {
    const preview = this.preview();
    return preview ? allRows(preview) : [];
  });

  protected readonly needsAttention = computed(() => {
    const resolutions = this.resolutions();
    const tiers = this.tiers();
    return this.rows().filter(
      (row) =>
        row.entry.match.status !== 'matched' &&
        !tiers[row.tierIndex]?.skip &&
        resolutions.get(row.key) === null,
    );
  });

  protected readonly handled = computed(() => {
    const resolutions = this.resolutions();
    return this.rows().filter(
      (row) =>
        row.entry.match.status !== 'matched' && resolutions.get(row.key) !== null,
    );
  });

  protected readonly matchedRows = computed(() =>
    this.rows().filter((row) => row.entry.match.status === 'matched'),
  );

  protected readonly plan = computed(() => {
    const preview = this.preview();
    if (!preview) return { placed: [], skipped: [] };
    return placements(preview, this.tiers(), this.resolutions(), this.duplicateWinners());
  });

  protected readonly planSummary = computed(() => {
    const { placed, skipped } = this.plan();
    const base = `${placed.length} Pokémon will be placed`;
    return skipped.length ? `${base}, ${skipped.length} skipped` : base;
  });

  protected readonly tierCounts = computed(() => {
    const counts = new Map<number, number>();
    for (const pokemon of this.plan().placed)
      counts.set(pokemon.tierIndex, (counts.get(pokemon.tierIndex) ?? 0) + 1);
    return counts;
  });

  protected readonly canApply = computed(
    () =>
      !this.applying() &&
      this.plan().placed.length > 0 &&
      (this.intoExisting || !!this.listName().trim()),
  );

  ngOnInit(): void {
    if (!this.intoExisting) return;
    const slug$ = this.routedSlug ? of(this.routedSlug) : this.tierLists.resolveTierListId();
    slug$.subscribe({
      next: (slug) => this.loadTarget(slug),
      error: () => this.targetFailed.set(true),
    });
  }

  protected loadTarget(slug: string): void {
    this.targetFailed.set(false);
    this.tierLists.getTierListEditBySlug(slug).subscribe({
      next: (view) =>
        this.target.set({
          slug: view.meta?.slug ?? slug,
          name: view.name ?? 'Tier List',
          format: view.format ?? '',
          ruleset: view.ruleset ?? '',
          version: view.meta?.version ?? 0,
          tiers: view.tierList,
          tournament: !!view.meta?.tournament,
        }),
      error: () => this.targetFailed.set(true),
    });
  }

  protected onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => this.text.set(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  protected read(layout?: LayoutId): void {
    if (!this.canRead() && !layout) return;
    const target = this.target();
    this.reading.set(true);
    this.readError.set(null);
    this.tierLists
      .previewImport({
        ...(this.source() === 'link' ? { url: this.url().trim() } : { text: this.text() }),
        format: target?.format ?? this.format(),
        ruleset: target?.ruleset ?? this.ruleset(),
        ...(layout && { layout }),
      })
      .subscribe({
        next: (preview) => {
          this.reading.set(false);
          this.preview.set(preview);
          this.tiers.set(initialTiers(preview));
          this.resolutions.set(initialResolutions(preview));
          this.duplicateWinners.set(
            new Map(preview.duplicates.map((duplicate) => [duplicate.pokemonId, duplicate.tiers[0]])),
          );
          if (!this.listName()) this.listName.set(this.suggestedName());
        },
        error: (err) => {
          this.reading.set(false);
          this.readError.set(apiErrorMessage(err, "Couldn't read that sheet."));
        },
      });
  }

  private suggestedName(): string {
    const file = this.fileName().replace(/\.[^.]+$/, '');
    return file || 'Imported Tier List';
  }

  protected resolve(row: ImportRow, resolution: Resolution): void {
    this.resolutions.update((current) => new Map(current).set(row.key, resolution));
  }

  protected pick(row: ImportRow, pokemon: DraftPokemon): void {
    this.resolve(row, [{ id: pokemon.id, name: pokemon.name }]);
  }

  protected resolutionOf(row: ImportRow): Resolution {
    return this.resolutions().get(row.key) ?? null;
  }

  protected chosenNames(row: ImportRow): string {
    const resolution = this.resolutionOf(row);
    if (!resolution) return '';
    if (resolution === 'skip') return 'Skipped';
    return resolution.map((option) => option.name).join(', ');
  }

  protected updateTier(index: number, patch: Partial<TierDraft>): void {
    this.tiers.update((tiers) =>
      tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    );
  }

  protected setWinner(pokemonId: string, tierIndex: number): void {
    this.duplicateWinners.update((current) => new Map(current).set(pokemonId, tierIndex));
  }

  protected optionsFor(row: ImportRow): MatchOption[] {
    const match = row.entry.match;
    return match.options?.length ? match.options : match.pokemon;
  }

  protected startOver(): void {
    this.preview.set(null);
    this.readError.set(null);
  }

  protected apply(): void {
    const preview = this.preview();
    if (!preview || !this.canApply()) return;
    const { placed, skipped } = this.plan();
    const target = this.target();
    this.applying.set(true);

    const remembered = this.remember() ? rememberedChoices(preview, this.resolutions()) : [];
    if (remembered.length)
      this.tierLists.rememberNames(remembered).subscribe({ error: () => undefined });

    const done = (slug: string | null) => {
      this.applying.set(false);
      this.toasts.show({
        title: 'Import Complete',
        message: skipped.length
          ? `${placed.length} Pokémon placed. Skipped: ${skipped.slice(0, 8).join(', ')}${skipped.length > 8 ? ` and ${skipped.length - 8} more` : ''}.`
          : `${placed.length} Pokémon placed.`,
        tone: skipped.length ? 'warning' : 'success',
      });
      if (slug) this.router.navigate([...tierListBase(this.league, slug), 'edit']);
    };
    const failed = (err: unknown) => {
      this.applying.set(false);
      this.toasts.error(apiErrorMessage(err, 'Could not save the import.'));
    };

    if (!target) {
      this.tierLists
        .create({
          name: this.listName().trim(),
          format: this.format(),
          ruleset: this.ruleset(),
          tiers: replacePayload(this.tiers(), placed),
        })
        .subscribe({ next: (created) => done(created.slug), error: failed });
      return;
    }

    const tiers =
      this.mode() === 'merge'
        ? mergePayload(this.tiers(), placed, target.tiers)
        : replacePayload(this.tiers(), placed, target.tiers);
    this.tierLists
      .saveTierListEdit(tiers, { version: target.version, kind: 'import' }, target.slug)
      .subscribe({ next: () => done(target.slug), error: failed });
  }
}
