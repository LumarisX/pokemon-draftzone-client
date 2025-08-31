import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { SpeedChart, Speedtier } from '../../matchup-interface';
import { SpeedtierComponent } from './speedtier/speedtier.component';

@Component({
  selector: 'speedchart',
  templateUrl: './speedchart.component.html',
  styleUrls: ['../../matchup.scss', './speedchart.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SpriteComponent,
    SpeedtierComponent,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    OverlayModule,
  ],
})
export class SpeedchartComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(NonNullableFormBuilder);

  @Input()
  set speedchart(value: SpeedChart) {
    this.level = value.level;
    this.setModifiers(value.modifiers);
    this.pokemons = value.teams
      .flatMap((team, teamIndex) =>
        team.map((pokemon) => ({
          id: pokemon.id,
          name: pokemon.name,
          nickname: pokemon.nickname,
          shiny: pokemon.shiny,
          spe: pokemon.spe,
          team: teamIndex,
        })),
      )
      .sort((x, y) => y.spe - x.spe);
    this.sortedTiers = value.teams
      .flatMap((team, teamIndex) =>
        team.flatMap((pokemon) =>
          pokemon.tiers.flatMap((tier) => ({
            modifiers: tier.modifiers,
            speed: tier.speed,
            pokemon: {
              id: pokemon.id,
              name: pokemon.name,
              nickname: pokemon.nickname,
              shiny: pokemon.shiny,
              spe: pokemon.spe,
            },
            team: teamIndex,
          })),
        ),
      )
      .sort((x, y) => y.speed - x.speed);
  }
  @Input()
  level = 100;
  filterOpen: boolean = false;
  pokemons: (Pokemon & { spe: number; team: number })[] = [];
  enabledMons: [string | null, string | null] = [null, null];
  sortedTiers: {
    modifiers: string[];
    speed: number;
    pokemon: Pokemon & {
      spe: number;
    };
    team: number;
  }[] = [];
  speedGroups = new BehaviorSubject<
    {
      tiers: Speedtier[];
      pokemon: Pokemon[];
      opened: boolean;
    }[]
  >([]);
  $destroy = new Subject<void>();
  modifiersForms!: FormGroup<{
    [key: string]: FormArray<FormControl<boolean>>;
  }>;

  ngOnInit() {
    this.resetModifiers();
    this.filter();
    this.modifiersForms.valueChanges
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => {
        this.filter();
      });
  }

  @ViewChild('speedContainer', { static: false }) speedContainer!: ElementRef;
  @ViewChild('tiersContainer', { static: false }) tiersMain!: ElementRef;

  private resizeObserver!: ResizeObserver;

  ngAfterViewInit(): void {
    this.observeBaseTiersHeight();
  }

  private observeBaseTiersHeight(): void {
    if (this.speedContainer && this.tiersMain) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateTiersMainHeight();
      });
      this.resizeObserver.observe(this.speedContainer.nativeElement);
    }
  }

  private updateTiersMainHeight(): void {
    if (this.speedContainer && this.tiersMain) {
      const baseHeight = this.speedContainer.nativeElement.offsetHeight;
      this.tiersMain.nativeElement.style.maxHeight = `${baseHeight}px`;
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setModifiers(modifiers: string[]) {
    this.modifiersForms = this.fb.group(
      modifiers.reduce(
        (acc, item) => {
          acc[item] = this.fb.array([false, false]);
          return acc;
        },
        {} as { [key: string]: FormArray<FormControl<boolean>> },
      ),
    );
  }

  generateGroups(tiers?: Speedtier[]) {
    if (!tiers) return;
    const groups = tiers.reduce((groups: Speedtier[][], tier) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && tier.team === lastGroup[0].team) {
        lastGroup.push(tier);
      } else {
        groups.push([tier]);
      }
      return groups;
    }, []);

    this.speedGroups.next(
      groups.map((group) => ({
        tiers: group,
        opened: false,
        pokemon: group.reduce((pokemon: Pokemon[], tier) => {
          if (pokemon.every((p) => p.id !== tier.pokemon.id))
            pokemon.push(tier.pokemon);
          return pokemon;
        }, []),
      })),
    );
  }

  filter() {
    this.generateGroups(
      this.sortedTiers.filter((tier) => {
        if (
          this.enabledMons[tier.team] &&
          tier.pokemon.id !== this.enabledMons[tier.team]
        )
          return false;

        return tier.modifiers.every(
          (mod) =>
            this.modifiersForms.controls[mod]?.controls.at(tier.team)?.value,
        );
      }),
    );
  }

  toggleView(
    pokemon: Pokemon & {
      spe: number;
      team: number;
    },
  ) {
    this.enabledMons[pokemon.team] =
      this.enabledMons[pokemon.team] == pokemon.id ? null : pokemon.id;
    this.filter();
  }

  resetModifiers() {
    const defaultModifiers = [
      '252',
      '252+',
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
    this.getModifiers().forEach(([modifier, array]) => {
      const isDefault = defaultModifiers.includes(modifier);
      array.controls.forEach((control) => control.setValue(isDefault));
    });
  }

  getModifiers() {
    return Object.entries(this.modifiersForms.controls).sort((x, y) =>
      x[0].localeCompare(y[0]),
    );
  }
}
