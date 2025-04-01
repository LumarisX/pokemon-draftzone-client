import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { SpeedChart, Speedtier, Summary } from '../../matchup-interface';
import { SpeedtierComponent } from './speedtier/speedtier.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'speedchart',
  templateUrl: './speedchart.component.html',
  styleUrls: ['../matchup.scss', './speedchart.component.scss'],
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
  @Input() speedchart!: SpeedChart;
  private _speeds: {
    pokemon: Pokemon & {
      baseStats: {
        spe: number;
      };
    };
    team: number;
  }[] = [];

  @Input() set speeds(summaries: Summary[]) {
    this._speeds = summaries
      .flatMap((summary, index) =>
        summary.team.map((pokemon) => ({ pokemon: pokemon, team: index })),
      )
      .sort((a, b) => b.pokemon.baseStats.spe - a.pokemon.baseStats.spe);
  }

  get speeds(): {
    pokemon: Pokemon & {
      baseStats: {
        spe: number;
      };
    };
    team: number;
  }[] {
    return this._speeds;
  }

  @Input() level = 100;
  filterOpen: boolean = false;

  enabledMons: [string | null, string | null] = [null, null];

  filteredTiers = new BehaviorSubject<
    {
      tiers: Speedtier[];
      pokemon: Pokemon[];
      opened: boolean;
    }[]
  >([]);
  constructor(private fb: NonNullableFormBuilder) {}

  $destroy = new Subject<void>();

  modifiersForms!: FormGroup<{ [key: string]: FormControl<boolean> }>[];

  ngOnInit() {
    this.modifiersForms = [
      this.fb.group(
        this.speedchart.modifiers.reduce(
          (acc, item) => {
            acc[item] = false;
            return acc;
          },
          {} as { [key: string]: boolean },
        ),
      ),
      this.fb.group(
        this.speedchart.modifiers.reduce(
          (acc, item) => {
            acc[item] = false;
            return acc;
          },
          {} as { [key: string]: boolean },
        ),
      ),
    ];
    this.resetModifiers();
    this.filter();

    this.modifiersForms.forEach((form) => {
      form.valueChanges.pipe(takeUntil(this.$destroy)).subscribe((change) => {
        this.filter();
      });
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

    this.filteredTiers.next(
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
      this.speedchart?.tiers.filter((tier) => {
        if (
          this.enabledMons[tier.team] &&
          tier.pokemon.id !== this.enabledMons[tier.team]
        )
          return false;
        const teamModifiers = this.modifiersForms[tier.team].value || {};
        return tier.modifiers.every((mod) => teamModifiers[mod]);
      }),
    );
  }

  toggleView(s: {
    pokemon: Pokemon & {
      baseStats: {
        spe: number;
      };
    };
    team: number;
  }) {
    this.enabledMons[s.team] =
      this.enabledMons[s.team] == s.pokemon.id ? null : s.pokemon.id;
    this.filter();
  }

  resetModifiers() {
    [
      '252',
      ' Positive',
      '0',
      'Negative',
      'Swift Swim',
      'Sand Rush',
      'Chlorophyll',
      'Slush Rush',
      'Protosynthesis',
      'Quick Feet',
      'Unburden',
      'Quark Drive',
      'Surge Surfer',
    ].forEach((modifier) => {
      this.modifiersForms.forEach((form) => {
        form.get(modifier)?.setValue(true);
      });
    });
  }
  getModifierControl(team: number, modifier: string): FormControl<boolean> {
    return this.modifiersForms[team].get(modifier) as FormControl<boolean>;
  }
}
