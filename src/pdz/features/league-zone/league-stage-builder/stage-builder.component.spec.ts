import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlexBracketMatch } from '../league-bracket/bracket.model';
import { StageBuilderComponent } from './stage-builder.component';
import { BuilderDraft, BuilderStage, nextRoundKey } from './stage-builder.model';

/** A match with both slots unassigned — only its cell placement matters here. */
function match(
  id: string,
  section: string,
  round: number,
  position = 0,
): FlexBracketMatch {
  return {
    id,
    section,
    round,
    position,
    a: { type: 'empty' },
    b: { type: 'empty' },
  };
}

function stage(key: string, order: number): BuilderStage {
  return {
    key,
    name: key,
    type: 'custom',
    teamIds: [],
    random: false,
    order,
  };
}

function draftOf(
  roundCount: number,
  stages: BuilderStage[],
  matches: FlexBracketMatch[],
): BuilderDraft {
  return {
    rounds: Array.from({ length: roundCount }, (_, i) => ({
      key: nextRoundKey(),
      name: `Round ${i + 1}`,
    })),
    stages,
    matches,
  };
}

describe('StageBuilderComponent drop targets', () => {
  let fixture: ComponentFixture<StageBuilderComponent>;

  // jsdom has no ResizeObserver, and both the grid and the wire canvas watch
  // themselves with one. Nothing here depends on it firing — these tests read
  // the rendered drop lists, not the measured wire geometry.
  const realResizeObserver = globalThis.ResizeObserver;

  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
  });

  // Jest reuses a worker's globals across spec files, so leaving the stub in
  // place would quietly decide whether unrelated suites pass.
  afterAll(() => {
    globalThis.ResizeObserver = realResizeObserver;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StageBuilderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StageBuilderComponent);
    fixture.componentInstance.editable = true;
  });

  /** `fixture.nativeElement` is `any`, which loses every query's result type. */
  const host = (): HTMLElement => fixture.nativeElement;

  /** Ids of every drop list the grid rendered, which is every drop target. */
  function dropListIds(): string[] {
    return Array.from(host().querySelectorAll<HTMLElement>('.cell')).map(
      (cell) => cell.id,
    );
  }

  function render(draft: BuilderDraft): void {
    fixture.componentInstance.draft = draft;
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
  }

  it('offers a drop target in every round a lone stage does not yet cover', () => {
    // One stage holding a single match in the middle of a five-round schedule.
    render(draftOf(5, [stage('groups', 0)], [match('m1', 'groups', 2)]));

    expect(dropListIds()).toEqual([
      'cell_groups_0',
      'cell_groups_1',
      'cell_groups_2',
      'cell_groups_3',
      'cell_groups_4',
    ]);
  });

  it('marks the rounds outside the span so they stay invisible until a drag', () => {
    render(draftOf(3, [stage('groups', 0)], [match('m1', 'groups', 1)]));

    const outside = Array.from(
      host().querySelectorAll<HTMLElement>('.cell--outside'),
    ).map((cell) => cell.id);

    expect(outside).toEqual(['cell_groups_0', 'cell_groups_2']);
  });

  it('never puts two stages sharing a column on the same round', () => {
    // Sequential stages are packed into one column, so the rounds between and
    // around them can only belong to one of the two.
    render(
      draftOf(
        6,
        [stage('groups', 0), stage('playoffs', 1)],
        [match('m1', 'groups', 1), match('m2', 'playoffs', 4)],
      ),
    );

    const ids = dropListIds();
    expect(new Set(ids).size).toBe(ids.length);

    const roundOf = (id: string) => Number(id.split('_')[2]);
    const rounds = ids.map(roundOf).sort((a, b) => a - b);
    expect(rounds).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('gives a gap between two stacked stages to the nearer one', () => {
    // groups holds round 0, playoffs round 4: rounds 1 and 2 are nearer groups,
    // round 3 nearer playoffs.
    render(
      draftOf(
        5,
        [stage('groups', 0), stage('playoffs', 1)],
        [match('m1', 'groups', 0), match('m2', 'playoffs', 4)],
      ),
    );

    expect(dropListIds().sort()).toEqual(
      [
        'cell_groups_0',
        'cell_groups_1',
        'cell_groups_2',
        'cell_playoffs_3',
        'cell_playoffs_4',
      ].sort(),
    );
  });

  it('lets stages in separate columns both reach the same round', () => {
    // Overlapping stages cannot share a column, so neither constrains the other.
    render(
      draftOf(
        3,
        [stage('group-a', 0), stage('group-b', 1)],
        [match('m1', 'group-a', 0), match('m2', 'group-b', 0)],
      ),
    );

    const ids = dropListIds();
    expect(ids).toContain('cell_group-a_2');
    expect(ids).toContain('cell_group-b_2');
  });

  it('only offers "+ Match" inside the stage box', () => {
    render(draftOf(3, [stage('groups', 0)], [match('m1', 'groups', 1)]));

    const addButtons = host().querySelectorAll('.cell__add');
    expect(addButtons.length).toBe(1);
  });

  it('grows the stage span when a match moves to a round outside it', () => {
    const draft = draftOf(4, [stage('groups', 0)], [match('m1', 'groups', 1)]);
    render(draft);

    const emitted: BuilderDraft[] = [];
    fixture.componentInstance.draftChange.subscribe((d) => emitted.push(d));

    // Exactly what a drop on the round-3 cell does. Called directly rather than
    // through a simulated drag, so the view has to be marked dirty by hand —
    // in the app the `cdkDropListDropped` binding does that.
    fixture.componentInstance['onDrop']({
      item: { data: 'm1' },
      container: { data: { stageKey: 'groups', round: 3 } },
      currentIndex: 0,
    } as never);
    // `fixture.changeDetectorRef` is the host view's, which leaves an OnPush
    // component clean; the component's own ref comes off its injector.
    fixture.debugElement.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();

    expect(emitted[0].matches[0].round).toBe(3);
    // The box now covers round 3 — its span is read back off the matches.
    expect(dropListIds()).toContain('cell_groups_3');
    expect(
      Array.from(
        host().querySelectorAll<HTMLElement>('.cell--outside'),
      ).map((c) => c.id),
    ).not.toContain('cell_groups_3');
  });
});
