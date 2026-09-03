import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { exportTeam } from '@pdz/sets';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
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
type Panel = 'set' | 'add' | 'export';

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
  protected readonly panel = signal<Panel>('add');

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

  protected readonly opponent = computed(() => this.context().opponent ?? []);

  protected readonly roster = computed(() => {
    const taken = new Set(this.store.sets().map((set) => set.id));
    return this.context().roster.map((entry) => ({
      ...entry,
      added: taken.has(entry.id),
    }));
  });

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
        return 'Saved locally — will retry';
      default:
        return '';
    }
  });

  constructor() {
    effect(() => {
      const context = this.context();
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
  }

  protected addFromRoster(id: string, nickname?: string): void {
    const index = this.store.addSet(id, nickname ? { nickname } : {});
    this.store.activeIndex.set(index);
    this.panel.set('set');
    this.view.set('details');
  }

  protected selectSet(index: number): void {
    this.store.activeIndex.set(index);
    this.panel.set('set');
  }

  protected removeSet(index: number, event: Event): void {
    event.stopPropagation();
    this.store.removeSet(index);
    if (this.store.sets().length === 0) this.panel.set('add');
  }

  protected spriteFor(index: number) {
    const set = this.store.sets()[index];
    return { id: set.id, name: set.nickname || set.id, shiny: set.shiny };
  }

}
