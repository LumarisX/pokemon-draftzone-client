import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { exportTeam } from '@pdz/sets';
import type { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { TeambuilderService } from '../data/teambuilder.service';
import { TeamStore } from '../state/team-store';
import type { TeambuilderContext } from '../teambuilder.context';
import { SetDetailsComponent } from './set-details.component';
import { SetMovesComponent } from './set-moves.component';
import { SetSpeedComponent } from './set-speed.component';
import { SetStatsComponent } from './set-stats.component';

type View = 'details' | 'moves' | 'stats' | 'speed';
type Panel = 'set' | 'export';

@Component({
  selector: 'pdz-teambuilder',
  templateUrl: './teambuilder.component.html',
  styleUrl: './teambuilder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TeamStore],
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    PokemonSearchComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SetDetailsComponent,
    SetMovesComponent,
    SetSpeedComponent,
    SetStatsComponent,
    SpriteComponent,
  ],
})
export class TeambuilderComponent {
  readonly context = input.required<TeambuilderContext>();
  readonly closed = output<void>();

  protected readonly store = inject(TeamStore);
  private readonly service = inject(TeambuilderService);

  protected readonly view = signal<View>('details');
  protected readonly panel = signal<Panel>('set');

  protected readonly rosterOptions$ = new BehaviorSubject<DraftPokemon[]>([]);

  private readonly slotEls = viewChildren<ElementRef<HTMLElement>>('slot');

  private readonly speciesRequest = computed(() => {
    const set = this.store.activeSet();
    const ruleset = this.store.ruleset();
    if (!set || !ruleset) return undefined;
    return { id: set.id, ruleset };
  });

  protected readonly species = rxResource({
    params: this.speciesRequest,
    stream: ({ params }) => this.service.getSpecies(params.id, params.ruleset),
  });

  protected readonly rosterSprites = computed(() =>
    this.store.sets().map((set) => ({
      id: set.id,
      name: this.store.displayName(set),
      shiny: set.shiny,
    })),
  );

  protected readonly opponent = computed(() => this.context().opponent ?? []);

  protected readonly hasRoster = computed(
    () => this.context().roster.length > 0,
  );

  protected readonly takenIds = computed(() =>
    this.store.sets().map((set) => set.id),
  );

  protected readonly activeSprite = computed(
    () => this.rosterSprites()[this.store.activeIndex()],
  );

  protected readonly exportText = computed(() => {
    const sets = this.store.sets();
    if (sets.length === 0) return '';
    return exportTeam([...sets], this.store.statRules(), this.store.names());
  });

  protected readonly statusLabel = computed(() => {
    switch (this.store.status()) {
      case 'saving':
        return 'Saving…';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Saved locally, will retry';
      default:
        return '';
    }
  });

  constructor() {
    effect(() => {
      const context = this.context();
      this.rosterOptions$.next([...context.roster]);
      void untracked(() =>
        this.store.load(
          { type: context.type, id: context.id },
          context.ruleset,
          context.level,
        ),
      );
    });

    effect(() => {
      const data = this.species.value();
      if (data) untracked(() => this.store.rememberSpecies(data));
    });

    effect(() => {
      const slot = this.slotEls()[this.store.activeIndex()];
      slot?.nativeElement.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  }

  protected addFromRoster(entry: DraftPokemon): void {
    const index = this.store.addSet(
      entry.id,
      entry.nickname ? { nickname: entry.nickname } : {},
    );
    this.store.activeIndex.set(index);
    this.panel.set('set');
    this.view.set('details');
  }

  protected selectSet(index: number): void {
    this.store.activeIndex.set(index);
    this.panel.set('set');
  }

  protected removeActive(): void {
    this.store.removeSet(this.store.activeIndex());
  }

  protected toggleExport(): void {
    this.panel.set(this.panel() === 'export' ? 'set' : 'export');
  }
}
