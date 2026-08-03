import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  generateRoundRobin,
  generateSingleElimination,
  offsetBracket,
} from '@pdz/features/league-zone/league-bracket/bracket-generator';
import { BracketTeamFlex } from '@pdz/features/league-zone/league-bracket/bracket.model';
import { StageBuilderComponent } from '@pdz/features/league-zone/league-stage-builder/stage-builder.component';
import {
  BuilderDraft,
  BuilderStage,
  nextRoundKey,
} from '@pdz/features/league-zone/league-stage-builder/stage-builder.model';

const TEAM_NAMES = [
  'Vermilion Volt',
  'Cerulean Cascade',
  'Pewter Pillars',
  'Fuchsia Fangs',
  'Saffron Psychics',
  'Celadon Blooms',
  'Cinnabar Flames',
  'Viridian Vipers',
];

/**
 * The stage builder against a fixture shaped like the design sketch: two group
 * sections running on different parts of the schedule, and a playoff bracket
 * after both. Exists so the layout, the wire routing and the drag targets can
 * be exercised without a live tournament.
 */
@Component({
  selector: 'pdz-debug-stage-builder',
  imports: [CommonModule, StageBuilderComponent],
  template: `
    <div class="wrap">
      <header class="wrap__header">
        <h1>Stage builder</h1>
        <label class="wrap__toggle">
          <input type="checkbox" [checked]="editable" (change)="toggle()" />
          Editable
        </label>
        <span class="wrap__log" data-add-stage-log>{{ addStageLog }}</span>
      </header>

      <pdz-stage-builder
        [draft]="draft"
        [teamsByStage]="teamsByStage"
        [editable]="editable"
        (draftChange)="draft = $event"
        (addStage)="onAddStage($event)"
      ></pdz-stage-builder>
    </div>
  `,
  styles: [
    `
      .wrap {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .wrap__header {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
      }

      /* Same sizing the real builder page gives it, so this harness exercises
         the grid's scroll containment rather than a looser version of it. */
      .wrap pdz-stage-builder {
        flex: 1 1 auto;
        min-height: 14rem;
      }

      .wrap__toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
    `,
  ],
})
export class DebugStageBuilderComponent {
  editable = true;

  /**
   * Four teams per stage, each numbered 1..4 within it.
   *
   * Deliberately overlapping seed numbers across stages: that is the shape
   * seeds have now, and a flat list would render one stage's teams in all of
   * them without anything looking obviously wrong.
   */
  teamsByStage = new Map<string, BracketTeamFlex[]>([
    ['group-a--rr', seedList(0)],
    ['group-b--rr', seedList(4)],
    ['playoffs--main', seedList(0)],
  ]);

  draft: BuilderDraft = buildFixture();
  /** Which round the last "+ Stage" click asked for. */
  addStageLog = '';

  toggle(): void {
    this.editable = !this.editable;
  }

  onAddStage(round: number): void {
    this.addStageLog = `add-stage:${round}`;
  }
}

/** Four teams starting at `offset` in the name list, seeded 1..4. */
function seedList(offset: number): BracketTeamFlex[] {
  return TEAM_NAMES.slice(offset, offset + 4).map((teamName, index) => ({
    teamName,
    coachName: `Coach ${offset + index + 1}`,
    seed: index + 1,
  }));
}

function buildFixture(): BuilderDraft {
  // Group A runs rounds 1-3, Group B joins at round 2, playoffs follow both.
  const groupA = offsetBracket(generateRoundRobin(4, 3), {
    prefix: 'group-a',
    seedOffset: 0,
    title: 'Group A',
    orderBase: 0,
  });
  const groupB = offsetBracket(generateRoundRobin(4, 2), {
    prefix: 'group-b',
    seedOffset: 0,
    roundOffset: 1,
    title: 'Group B',
    orderBase: 1,
  });
  const playoffs = offsetBracket(generateSingleElimination(4), {
    prefix: 'playoffs',
    seedOffset: 0,
    roundOffset: 3,
    title: 'Playoffs',
    orderBase: 2,
  });

  const matches = [...groupA.matches, ...groupB.matches, ...playoffs.matches];
  const stages: BuilderStage[] = [
    ...groupA.sections.map((s) => ({ ...s, type: 'round-robin' as const })),
    ...groupB.sections.map((s) => ({ ...s, type: 'round-robin' as const })),
    ...playoffs.sections.map((s) => ({
      ...s,
      type: 'single-elimination' as const,
    })),
  ].map((section, index) => ({
    key: section.key,
    name: section.title ?? section.key,
    type: section.type,
    teamIds: [],
    random: false,
    order: section.order ?? index,
  }));

  const roundCount = matches.reduce((max, m) => Math.max(max, m.round + 1), 0);
  return {
    rounds: Array.from({ length: roundCount }, (_, i) => ({
      key: nextRoundKey(),
      name: `Week ${i + 1}`,
      matchDeadline: new Date(
        Date.UTC(2026, 7, 7 + i * 7, 23, 59),
      ).toISOString(),
    })),
    stages,
    matches,
  };
}
