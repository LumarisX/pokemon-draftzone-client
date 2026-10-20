import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { TeamSlot } from '@pdz/core/utils/versus';
import { TeamComponent, TeamSize } from '@pdz/shared/data/team/team.component';
import { ResultBoxComponent } from '@pdz/shared/data/result-box/result-box.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

export type MatchupSize = 'row' | 'card' | 'hero';
export type MatchupResult = 'win' | 'loss' | 'draw';

export type MatchupTeam = {
  name: string;
  logo?: string | null;
  coach?: string | null;
  link?: readonly unknown[] | string | null;
  you?: boolean;
  score?: number | null;
  result?: MatchupResult | null;
  pending?: boolean;
  selectable?: boolean;
  pokemon?: readonly Pokemon<DraftOptions>[] | null;
};

type SideView = {
  slot: TeamSlot;
  team: MatchupTeam;
  align: 'start' | 'end';
};

const RESULT_LETTER: Record<MatchupResult, string> = {
  win: 'W',
  loss: 'L',
  draw: 'D',
};

const RESULT_WORD: Record<MatchupResult, string> = {
  win: 'won',
  loss: 'lost',
  draw: 'drew',
};

const TEAM_SIZES: Record<MatchupSize, TeamSize> = {
  row: 'row',
  card: 'row',
  hero: 'hero',
};

@Component({
  selector: 'pdz-matchup',
  imports: [RouterLink, ResultBoxComponent, SpriteComponent, TeamComponent],
  template: `
    <div class="pdz-matchup__frame">
      <div class="pdz-matchup__header">
        @if (label()) {
          <span class="pdz-matchup__label">{{ label() }}</span>
        }
        <ng-content select="[pdz-matchup-status]" />
      </div>

      <div class="pdz-matchup__body">
        @for (side of sides(); track side.slot) {
          <div
            class="pdz-matchup__side"
            [class.pdz-matchup__side--team1]="side.slot === 'team1'"
            [class.pdz-matchup__side--team2]="side.slot === 'team2'"
            [class.pdz-matchup__side--you]="side.team.you"
            [attr.data-result]="side.team.result ?? null"
          >
            <div class="pdz-matchup__identity">
              @if (side.team.pending) {
                <span class="pdz-matchup__pending">
                  <span
                    class="pdz-matchup__pending-logo"
                    aria-hidden="true"
                  ></span>
                  @if (side.team.selectable) {
                    <button
                      type="button"
                      class="pdz-matchup__pending-name pdz-matchup__pending-name--action"
                      [attr.aria-label]="'Show ' + side.team.name"
                      (click)="sideSelect.emit(side.slot)"
                    >
                      {{ side.team.name }}
                    </button>
                  } @else if (side.team.link; as link) {
                    <a
                      class="pdz-matchup__pending-name pdz-matchup__pending-name--action"
                      [routerLink]="link"
                      >{{ side.team.name }}</a
                    >
                  } @else {
                    <span class="pdz-matchup__pending-name">{{
                      side.team.name
                    }}</span>
                  }
                  @if (side.team.coach) {
                    <span class="pdz-matchup__pending-detail">{{
                      side.team.coach
                    }}</span>
                  }
                </span>
              } @else {
                <pdz-team
                  class="pdz-matchup__team"
                  [size]="teamSize()"
                  [align]="side.align"
                  [name]="side.team.name"
                  [logo]="side.team.logo"
                  [coach]="side.team.coach"
                  [link]="side.team.link"
                />
              }

              @if (size() === 'card' && hasScore()) {
                <pdz-result-box
                  class="pdz-matchup__side-score"
                  [side]="side.slot"
                  [attr.aria-label]="sideLabel(side.team)"
                  >{{ side.team.score ?? 0 }}</pdz-result-box
                >
              }
            </div>

            @if (side.slot === 'team1') {
              <ng-content select="[pdz-matchup-team1]" />
            } @else {
              <ng-content select="[pdz-matchup-team2]" />
            }

            @if (size() === 'hero' && side.team.pokemon?.length) {
              <div class="pdz-matchup__roster" aria-hidden="true">
                @for (pokemon of side.team.pokemon; track $index) {
                  <pdz-sprite
                    class="pdz-matchup__sprite"
                    size="fill"
                    [pokemon]="pokemon"
                    [flipped]="side.slot === 'team1'"
                    [showFormes]="false"
                  />
                }
              </div>
            }
          </div>

          @if ($first) {
            <div class="pdz-matchup__center">
              @if (hasScore()) {
                <span
                  class="pdz-matchup__score"
                  [attr.aria-label]="
                    'Score ' +
                    (team1().score ?? 0) +
                    ' to ' +
                    (team2().score ?? 0)
                  "
                >
                  @if (size() === 'hero') {
                    <span class="pdz-matchup__tally">
                      <span
                        class="pdz-matchup__points pdz-matchup__points--team1"
                        >{{ team1().score ?? 0 }}</span
                      >
                      @if (team1().result; as result) {
                        <pdz-result-box size="sm" [result]="result">{{
                          letter[result]
                        }}</pdz-result-box>
                      }
                    </span>
                    <span class="pdz-matchup__dash" aria-hidden="true">–</span>
                    <span class="pdz-matchup__tally">
                      <span
                        class="pdz-matchup__points pdz-matchup__points--team2"
                        >{{ team2().score ?? 0 }}</span
                      >
                      @if (team2().result; as result) {
                        <pdz-result-box size="sm" [result]="result">{{
                          letter[result]
                        }}</pdz-result-box>
                      }
                    </span>
                  } @else {
                    <pdz-result-box side="team1">{{
                      team1().score ?? 0
                    }}</pdz-result-box>
                    <span class="pdz-matchup__dash" aria-hidden="true">–</span>
                    <pdz-result-box side="team2">{{
                      team2().score ?? 0
                    }}</pdz-result-box>
                  }
                </span>
              } @else {
                <span class="pdz-matchup__vs">vs</span>
              }
              <ng-content select="[pdz-matchup-center]" />
            </div>
          }
        }
      </div>

      <div class="pdz-matchup__footer">
        <ng-content select="[pdz-matchup-actions]" />
      </div>
    </div>
  `,
  styleUrl: './matchup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-matchup',
    '[attr.data-size]': 'size()',
  },
})
export class MatchupComponent {
  readonly team1 = input.required<MatchupTeam>();
  readonly team2 = input.required<MatchupTeam>();
  readonly size = input<MatchupSize>('card');
  readonly label = input<string | null | undefined>();

  readonly sideSelect = output<TeamSlot>();

  protected readonly teamSize = computed(() => TEAM_SIZES[this.size()]);
  protected readonly letter = RESULT_LETTER;

  protected sideLabel(team: MatchupTeam): string {
    const score = `${team.name} ${team.score ?? 0}`;
    return team.result ? `${score}, ${RESULT_WORD[team.result]}` : score;
  }

  protected readonly hasScore = computed(
    () => this.team1().score != null || this.team2().score != null,
  );

  protected readonly sides = computed<SideView[]>(() => {
    const stacked = this.size() === 'card';
    return [
      { slot: 'team1', team: this.team1(), align: 'start' },
      { slot: 'team2', team: this.team2(), align: stacked ? 'start' : 'end' },
    ];
  });
}
