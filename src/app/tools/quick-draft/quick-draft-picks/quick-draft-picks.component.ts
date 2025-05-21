import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Stat } from '../../../data';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Pokemon } from '../../../interfaces/pokemon';
import { DataService } from '../../../services/data.service';
import { typeColor } from '../../../util/styling';
import { QDSettings } from '../quick-draft-setting/quick-draft-setting.component';
import {
  trigger,
  state,
  animate,
  style,
  transition,
} from '@angular/animations';

export type QDPokemon = Pokemon<{
  tier: string;
  types: string[];
  baseStats: { [key in Stat]: number };
  abilities: string[];
  level: string;
  loaded?: boolean;
}>;

@Component({
  selector: 'pdz-quick-draft-picks',
  imports: [
    CommonModule,
    MatIconModule,
    SpriteComponent,
    LoadingComponent,
    MatButtonModule,
  ],
  templateUrl: './quick-draft-picks.component.html',
  styleUrls: [
    './quick-draft-picks.component.scss',
    '../quick-draft.component.scss',
  ],
  animations: [
    trigger('optionAnimation', [
      state(
        'selected-disappear',
        style({
          opacity: 0,
          transform: 'translateY(-50%)',
        }),
      ),
      state(
        'unselected-disappear',
        style({
          opacity: 0,
        }),
      ),
      transition('* => selected-disappear', [animate('400ms ease-out')]),
      transition('* => unselected-disappear', [animate('400ms ease-out')]),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(50%)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
})
export class QuickDraftPicksComponent implements OnInit {
  @Input({ required: true })
  settings!: QDSettings;

  @Output()
  finalDraft = new EventEmitter<QDPokemon[]>();

  currentPick = 0;

  draft!: (QDPokemon | null)[];
  draftOptions: QDPokemon[] | null = null;
  selectedOption: number | null = null;

  optionCount = 3;

  animationStates: ('void' | 'selected-disappear' | 'unselected-disappear')[] =
    [];

  constructor(private dataService: DataService) {}

  get totalPicks() {
    return this.settings.tiers.reduce((count, tier) => {
      return count + tier[1];
    }, 0);
  }

  ngOnInit(): void {
    this.draft = [...new Array(this.totalPicks).fill(null)];
    this.getRandomOptions();
  }

  typeColor = typeColor;

  clickOption(index: number) {
    this.selectedOption = this.selectedOption === index ? null : index;
  }

  getRandomOptions() {
    this.draftOptions = null;
    this.selectedOption = null;
    const tier = this.getPick(this.currentPick);
    this.dataService
      .getRandom(
        this.optionCount,
        this.settings.ruleset,
        this.settings.format,
        {
          tier: tier[0],
          banned: this.draft
            .filter((pokemon) => pokemon !== null && pokemon.tier === tier[0])
            .map((pokemon) => pokemon!.id),
        },
      )
      .subscribe((data) => {
        if (data.length) {
          this.draftOptions = data;
          this.animationStates = data.map(() => 'void');
        } else {
          tier[1] = this.currentPick;
          this.checkNext();
        }
      });
  }

  rerollPicks() {
    if (this.settings.rerolls <= 0) return;
    this.draftOptions!.forEach((_, i) => {
      this.animationStates[i] = 'unselected-disappear';
    });
    setTimeout(() => {
      this.getRandomOptions();
      this.settings.rerolls -= 1;
    }, 400);
  }

  draftOption() {
    if (this.selectedOption === null || !this.draftOptions) return;
    this.draftOptions.forEach((_, i) => {
      if (i === this.selectedOption) {
        this.animationStates[i] = 'selected-disappear';
      } else {
        this.animationStates[i] = 'unselected-disappear';
      }
    });
    setTimeout(() => {
      this.draft[this.currentPick] = this.draftOptions![this.selectedOption!];
      this.currentPick++;
      this.checkNext();
    }, 400);
  }

  private checkNext() {
    if (this.currentPick < this.totalPicks) {
      this.getRandomOptions();
    } else {
      this.finalDraft.emit(this.draft.filter((pokemon) => pokemon !== null));
    }
  }

  private getPick(pick: number): [string, number] {
    for (let i = 0; i < this.settings.tiers.length; i++) {
      if (pick < this.settings.tiers[i][1]) return this.settings.tiers[i];
      pick -= this.settings.tiers[i][1];
    }
    return ['err', 0];
  }

  allLoaded(pokemons: QDPokemon[]) {
    return pokemons.every((pokemon) => pokemon.loaded);
  }
}
