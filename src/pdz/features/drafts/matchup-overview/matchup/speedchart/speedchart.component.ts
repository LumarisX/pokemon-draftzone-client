import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder } from '@angular/forms';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { DraftPokemon } from '../../../draft.model';
import { SpeedChart, Speedtier } from '../../matchup-interface';
import {
  ModifierForms,
  SpeedchartFiltersComponent,
} from './filters/speedchart-filters.component';
import {
  SpeedtierGroup,
  SpeedtierGroupComponent,
} from './tier-group/speedtier-group.component';

type BaseSpeed = DraftPokemon & { spe: number; team: number };

const DEFAULT_MODIFIERS = [
  '252',
  '252+',
  '32+',
  '32',
  '0',
  '0- 0ivs',
  'Swift Swim',
  'Sand Rush',
  'Chlorophyll',
  'Slush Rush',
  'Protosynthesis',
  'Quick Feet',
  'Unburden',
  'Quark Drive',
  'Surge Surfer',
];

@Component({
  selector: 'pdz-speedchart',
  templateUrl: './speedchart.component.html',
  styleUrl: './speedchart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    SpeedchartFiltersComponent,
    SpeedtierGroupComponent,
    SpriteComponent,
    WidgetComponent,
  ],
})
export class SpeedchartComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input()
  set speedchart(value: SpeedChart) {
    this.level.set(value.level);
    this.setModifiers(value.modifiers);

    const entries = value.teams.flatMap((team, teamIndex) =>
      team.flatMap((pokemon) => {
        const base = {
          pokemon: {
            id: pokemon.id,
            name: pokemon.name,
            nickname: pokemon.nickname,
            shiny: pokemon.shiny,
          },
          spe: pokemon.spe,
          tiers: pokemon.tiers,
          team: teamIndex,
        };

        const formes = (pokemon.draftFormes ?? [])
          .filter((forme) => forme.spe !== undefined)
          .map((forme) => ({
            pokemon: {
              id: forme.id as DraftPokemon['id'],
              name: forme.name,
              nickname: undefined,
              shiny: pokemon.shiny,
            },
            spe: forme.spe!,
            tiers: forme.tiers ?? [],
            team: teamIndex,
          }));

        return [base, ...formes];
      }),
    );

    this.pokemons.set(
      entries
        .map((entry) => ({
          ...entry.pokemon,
          spe: entry.spe,
          team: entry.team,
        }))
        .sort((x, y) => y.spe - x.spe),
    );

    this.sortedTiers = entries
      .flatMap((entry) =>
        entry.tiers.map((tier) => ({
          modifiers: tier.modifiers,
          speed: tier.speed,
          pokemon: { ...entry.pokemon, spe: entry.spe },
          team: entry.team,
        })),
      )
      .sort((x, y) => y.speed - x.speed);
  }

  readonly level = model(100);

  protected readonly pokemons = signal<BaseSpeed[]>([]);
  protected readonly groups = signal<SpeedtierGroup[]>([]);
  protected readonly lockedMons = signal<[string | null, string | null]>([
    null,
    null,
  ]);
  protected modifiersForms!: ModifierForms;

  private sortedTiers: (Omit<Speedtier, 'pokemon'> & {
    pokemon: DraftPokemon & { spe: number };
  })[] = [];
  private resizeObserver?: ResizeObserver;

  private readonly baseList = viewChild<ElementRef<HTMLElement>>('baseList');
  private readonly groupList = viewChild<ElementRef<HTMLElement>>('groupList');

  ngOnInit() {
    this.resetModifiers();
    this.filter();
    this.modifiersForms.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.filter());
  }

  ngAfterViewInit() {
    const base = this.baseList()?.nativeElement;
    const groups = this.groupList()?.nativeElement;
    if (!base || !groups) return;

    this.resizeObserver = new ResizeObserver(() => {
      groups.style.maxHeight = `${base.offsetHeight}px`;
    });
    this.resizeObserver.observe(base);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  protected isLocked(pokemon: BaseSpeed) {
    return this.lockedMons()[pokemon.team] === pokemon.id;
  }

  protected toggleLock(pokemon: BaseSpeed) {
    this.lockedMons.update((locked) => {
      const next: [string | null, string | null] = [...locked];
      next[pokemon.team] = this.isLocked(pokemon) ? null : pokemon.id;
      return next;
    });
    this.filter();
  }

  protected resetModifiers() {
    Object.entries(this.modifiersForms.controls).forEach(
      ([modifier, teams]) => {
        const isDefault = DEFAULT_MODIFIERS.includes(modifier);
        teams.controls.forEach((control) => control.setValue(isDefault));
      },
    );
  }

  private setModifiers(modifiers: string[]) {
    this.modifiersForms = this.fb.group(
      modifiers.reduce(
        (acc, item) => {
          acc[item] = this.fb.array([false, false]);
          return acc;
        },
        {} as ModifierForms['controls'],
      ),
    );
  }

  private filter() {
    this.groupTiers(
      this.sortedTiers.filter((tier) => {
        const locked = this.lockedMons()[tier.team];
        if (locked && tier.pokemon.id !== locked) return false;

        return tier.modifiers.every(
          (mod) =>
            this.modifiersForms.controls[mod]?.controls.at(tier.team)?.value,
        );
      }),
    );
  }

  private groupTiers(tiers: Speedtier[]) {
    const groups = tiers.reduce((groups: Speedtier[][], tier) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && tier.team === lastGroup[0].team) {
        lastGroup.push(tier);
      } else {
        groups.push([tier]);
      }
      return groups;
    }, []);

    this.groups.set(
      groups.map((tiers) => ({
        tiers,
        pokemon: tiers.reduce((pokemon: DraftPokemon[], tier) => {
          if (pokemon.every((p) => p.id !== tier.pokemon.id))
            pokemon.push(tier.pokemon);
          return pokemon;
        }, []),
      })),
    );
  }
}
