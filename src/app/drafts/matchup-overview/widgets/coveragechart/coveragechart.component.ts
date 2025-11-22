import { CommonModule } from '@angular/common';
import { Component, Input, Type } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  tap,
} from 'rxjs';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import {
  Move,
  PokemonSet,
} from '../../../../tools/teambuilder/pokemon-builder.model';
import { TypeChart, TypeChartPokemon } from '../../matchup-interface';
import { MatTooltipModule } from '@angular/material/tooltip';

type ScoreRange = {
  min: number;
  max: number;
  colorClass: string;
};

@Component({
  selector: 'pdz-coveragechart',
  templateUrl: './coveragechart.component.html',
  styleUrls: ['./coveragechart.component.scss', '../../matchup.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    SpriteComponent,
    MatTooltipModule,
  ],
})
export class CoverageComponent {
  @Input({ required: true }) typechart!: TypeChart;
  @Input({ required: true }) team!: PokemonSet[];

  @Input()
  weakRanges: ScoreRange[] = [
    { min: 5, max: Infinity, colorClass: 'pdz-scale-positive-6' },
    { min: 4, max: 5, colorClass: 'pdz-scale-positive-5' },
    { min: 3, max: 4, colorClass: 'pdz-scale-positive-4' },
    { min: 2, max: 3, colorClass: 'pdz-scale-positive-3' },
    { min: 1, max: 2, colorClass: 'pdz-scale-neutral' },
    { min: -Infinity, max: 1, colorClass: 'pdz-scale-negative-3' },
  ];
  @Input() resistRanges: ScoreRange[] = [
    { min: 5, max: Infinity, colorClass: 'pdz-scale-negative-6' },
    { min: 4, max: 5, colorClass: 'pdz-scale-negative-5' },
    { min: 3, max: 4, colorClass: 'pdz-scale-negative-4' },
    { min: 2, max: 3, colorClass: 'pdz-scale-negative-3' },
    { min: 1, max: 2, colorClass: 'pdz-scale-neutral' },
    { min: -Infinity, max: 1, colorClass: 'pdz-scale-positive-3' },
  ];

  abilities: boolean = true;
  columnHovered = new BehaviorSubject<string | null>(null);

  weaknessColor(weak: number): string {
    if (weak > 4) return 'pdz-scale-positive-5';
    if (weak > 2) return 'pdz-scale-positive-4';
    if (weak > 1) return 'pdz-scale-positive-3';
    if (weak < 0.25) return 'pdz-scale-negative-5';
    if (weak < 0.5) return 'pdz-scale-negative-4';
    if (weak < 1) return 'pdz-scale-negative-3';
    return 'pdz-scale-neutral';
  }

  getBestWeakness(
    pokemon: PokemonSet,
    against: TypeChartPokemon,
  ): { weak: number; move?: Move } {
    const abilityIndex = this.abilities ? 0 : 1;
    const weaknesses = pokemon.moves.reduce(
      (acc, move) => {
        if (!move) return acc;
        const weak =
          move.type === 'Stellar' ? 1 : against.weak[abilityIndex][move.type];
        if (
          weak > acc.weak ||
          (weak === acc.weak && move.strength > (acc.move?.strength || 0))
        ) {
          return { weak, move };
        }
        return acc;
      },
      { weak: 0 } as { weak: number; move?: Move },
    );
    return weaknesses;
  }

  weakCount(oppPokemon: TypeChartPokemon): number {
    return this.team.reduce((acc, p) => {
      const best = this.getBestWeakness(p, oppPokemon);
      if (best.weak > 1) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }

  resistCount(oppPokemon: TypeChartPokemon): number {
    return this.team.reduce((acc, p) => {
      const best = this.getBestWeakness(p, oppPokemon);
      if (best.weak < 1) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }

  weakColor(weak: number): string {
    return this.getColorFromRanges(weak, this.weakRanges);
  }

  resistColor(resist: number): string {
    return this.getColorFromRanges(resist, this.resistRanges);
  }

  private getColorFromRanges(value: number, ranges: ScoreRange[]): string {
    for (const range of ranges) {
      if (value >= range.min && value < range.max) {
        return range.colorClass;
      }
    }
    return 'pdz-scale-neutral';
  }
}
