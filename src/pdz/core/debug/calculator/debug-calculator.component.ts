import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { CalcChartsComponent } from './calc-charts.component';
import {
  CalcRequest,
  CalcResponse,
  CalcSideInput,
  ForcedOutcome,
} from './calculator.model';
import { CalculatorService } from './calculator.service';

interface SideForm {
  species: string;
  level: number;
  ability: string;
  item: string;
  nature: string;
  evs: string;
  boosts: string;
  status: string;
  hp: string;
  teraType: string;
  terastallized: boolean;
}

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const BOOSTS = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];

@Component({
  selector: 'pdz-debug-calculator',
  imports: [
    FormsModule,
    JsonPipe,
    PageComponent,
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
    CheckComponent,
    ChoiceDirective,
    CalcChartsComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  templateUrl: './debug-calculator.component.html',
  styleUrl: './debug-calculator.component.scss',
})
export class DebugCalculatorComponent {
  private calculator = inject(CalculatorService);

  readonly natures = [
    '',
    'Adamant',
    'Bold',
    'Calm',
    'Careful',
    'Impish',
    'Jolly',
    'Modest',
    'Naive',
    'Serious',
    'Timid',
  ];
  readonly statuses = ['', 'brn', 'par', 'psn', 'tox', 'slp', 'frz'];
  readonly weathers = [
    '',
    'Sun',
    'Rain',
    'Sand',
    'Snow',
    'Harsh Sunshine',
    'Heavy Rain',
  ];
  readonly terrains = ['', 'Electric', 'Grassy', 'Psychic', 'Misty'];
  readonly types = [
    '',
    'Normal',
    'Fire',
    'Water',
    'Electric',
    'Grass',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Dark',
    'Steel',
    'Fairy',
  ];

  readonly rulesets = signal<{ name: string; id: string }[]>([]);
  readonly ruleset = signal('Gen9 NatDex');
  readonly move = signal('Blaze Kick');
  readonly weather = signal('');
  readonly terrain = signal('');
  readonly turns = signal(10);
  readonly forcedHit = signal<ForcedOutcome>('roll');
  readonly forcedCrit = signal<ForcedOutcome>('roll');

  readonly attacker = signal<SideForm>(
    this.blankSide('Blaziken', 'Adamant', 'atk 252'),
  );
  readonly defender = signal<SideForm>(
    this.blankSide('Toxapex', '', 'hp 252, def 252'),
  );

  readonly result = signal<CalcResponse | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly loading = signal(false);
  readonly showRaw = signal(false);

  constructor() {
    this.calculator.rulesets().subscribe({
      next: (groups) => this.rulesets.set(groups.flatMap(([, list]) => list)),
      error: () => this.rulesets.set([]),
    });
  }

  private blankSide(species: string, nature: string, evs: string): SideForm {
    return {
      species,
      level: 100,
      ability: '',
      item: '',
      nature,
      evs,
      boosts: '',
      status: '',
      hp: '',
      teraType: '',
      terastallized: false,
    };
  }

  patchAttacker<K extends keyof SideForm>(key: K, value: SideForm[K]) {
    this.attacker.update((side) => ({ ...side, [key]: value }));
  }

  patchDefender<K extends keyof SideForm>(key: K, value: SideForm[K]) {
    this.defender.update((side) => ({ ...side, [key]: value }));
  }

  run() {
    this.loading.set(true);
    this.error.set(undefined);

    const request: CalcRequest = {
      ruleset: this.ruleset(),
      attacker: this.toSide(this.attacker()),
      defender: this.toSide(this.defender()),
      move: this.move(),
      field: { weather: this.weather(), terrain: this.terrain() },
      turns: this.turns(),
      overrides: { hit: this.forcedHit(), crit: this.forcedCrit() },
    };

    this.calculator.calculate(request).subscribe({
      next: (response) => {
        this.result.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Request failed');
        this.result.set(undefined);
        this.loading.set(false);
      },
    });
  }

  private toSide(form: SideForm): CalcSideInput {
    return {
      species: form.species,
      level: form.level,
      ability: form.ability || undefined,
      item: form.item || undefined,
      nature: form.nature || undefined,
      evs: parseSpread(form.evs, STATS),
      boosts: parseSpread(form.boosts, BOOSTS),
      status: form.status || undefined,
      hp: form.hp ? Number(form.hp) : undefined,
      teraType: form.teraType || undefined,
      terastallized: form.terastallized,
    };
  }

  percent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  rawJson(): string {
    return JSON.stringify(this.result(), null, 2);
  }

  copyRaw() {
    navigator.clipboard.writeText(this.rawJson());
  }

  inputJson(): string {
    return JSON.stringify(this.result()?.input, null, 2);
  }
}

function parseSpread(
  value: string,
  allowed: string[],
): Record<string, number> | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const spread: Record<string, number> = {};
  for (const part of trimmed.split(/[,/]/)) {
    const match = part
      .trim()
      .match(/^([+-]?\d+)\s*([a-z]+)$|^([a-z]+)\s*([+-]?\d+)$/i);
    if (!match) continue;
    const stat = (match[2] ?? match[3] ?? '').toLowerCase();
    const amount = Number(match[1] ?? match[4]);
    if (allowed.includes(stat) && !Number.isNaN(amount)) spread[stat] = amount;
  }
  return Object.keys(spread).length ? spread : undefined;
}
