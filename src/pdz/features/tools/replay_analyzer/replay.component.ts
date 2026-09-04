import { DecimalPipe, PercentPipe, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

import { ReplayChartComponent } from './replay-chart/replay-chart.component';
import {
  ReplayHistoryEntry,
  ReplayHistoryService,
} from './replay-history.service';
import {
  ReplayAnalysis,
  ReplayAnalyzerVersion,
  ReplayKOMon,
  ReplayPlayer,
} from './replay.interface';
import { ReplayService } from './replay.service';

const DETAILS_STORAGE_KEY = 'pdz.replayAnalyzer.showAdvancedDetails';

type ReplayStatus = 'idle' | 'loading' | 'ready' | 'error';

type PlayerView = ReplayPlayer & {
  killsMismatch: boolean;
  deathsMismatch: boolean;
};

type TimelineMode = 'visual' | 'text';

type KODirection = 'left' | 'right' | 'same' | 'none';

type KOMonView = {
  pokemon: { id: string; name: string; shiny?: true };
  role: 'attacker' | 'victim';
};

type KORow = {
  turn: number;
  left: KOMonView[];
  right: KOMonView[];
  direction: KODirection;
  label: string;
  indirect: boolean;
  summary: string;
};

@Component({
  selector: 'pdz-replay-analyzer',
  templateUrl: './replay.component.html',
  styleUrls: ['./replay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    PercentPipe,
    TitleCasePipe,
    FormsModule,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    PageComponent,
    ReplayChartComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SkeletonComponent,
    SlideToggleComponent,
    SpriteComponent,
    TooltipDirective,
    WidgetComponent,
  ],
})
export class ReplayComponent {
  private readonly replayService = inject(ReplayService);
  private readonly history = inject(ReplayHistoryService);
  private readonly dialog = inject(DialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly historyEntries = this.history.entries;
  protected readonly historyFilter = signal('');

  protected readonly visibleHistory = computed(() => {
    const term = this.historyFilter().trim().toLowerCase();
    const entries = this.historyEntries();
    if (!term) {
      return entries;
    }
    return entries.filter((entry) =>
      [entry.id, ...entry.players].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  });

  private readonly version: ReplayAnalyzerVersion =
    this.route.snapshot.data['version'] === 'v2' ? 'v2' : 'v1';

  protected readonly replayURI = signal('');
  protected readonly analyzedURI = signal('');
  protected readonly status = signal<ReplayStatus>('idle');
  protected readonly showDetails = signal(readDetailsPreference());

  private readonly analysis = signal<ReplayAnalysis | undefined>(undefined);

  protected readonly loading = computed(() => this.status() === 'loading');

  protected readonly skeletonStats = Array.from({ length: 4 });
  protected readonly skeletonPlayers = Array.from({ length: 2 });
  protected readonly skeletonTeam = Array.from({ length: 6 });

  protected readonly canAnalyze = computed(() => {
    const uri = this.replayURI().trim();
    if (!uri || this.loading()) {
      return false;
    }
    return this.status() !== 'ready' || uri !== this.analyzedURI();
  });

  protected readonly summary = computed(() => {
    const analysis = this.analysis();
    if (!analysis) {
      return undefined;
    }
    const seconds = analysis.gameTime;
    return {
      format: analysis.gametype,
      generation: analysis.genNum,
      turns: analysis.turns,
      duration: `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`,
    };
  });

  protected readonly players = computed<PlayerView[]>(() => {
    const roster = this.analysis()?.players ?? [];
    return roster.map((player, index) => {
      const others = roster.filter((_, otherIndex) => otherIndex !== index);
      const otherDeaths = others.reduce((sum, p) => sum + p.total.deaths, 0);
      const otherKills = others.reduce((sum, p) => sum + p.total.kills, 0);
      return {
        ...player,
        killsMismatch: player.total.kills !== otherDeaths,
        deathsMismatch: player.total.deaths !== otherKills,
      };
    });
  });

  protected readonly events = computed(() => this.analysis()?.events ?? []);

  protected readonly timelineMode = signal<TimelineMode>('visual');

  protected readonly koTimeline = computed<KORow[]>(() =>
    (this.analysis()?.kos ?? []).map((ko) => {
      const left: KOMonView[] = [];
      const right: KOMonView[] = [];
      const place = (mon: ReplayKOMon, role: KOMonView['role']) => {
        const lane = mon.player % 2 === 1 ? left : right;
        lane.push({
          pokemon: { id: mon.id, name: mon.name, shiny: mon.shiny },
          role,
        });
      };

      const attacker = ko.self ? undefined : ko.attacker;
      if (attacker) {
        place(attacker, 'attacker');
      }
      place(ko.victim, 'victim');

      const label = ko.move ?? ko.cause ?? '';

      let direction: KODirection = 'none';
      if (attacker) {
        direction =
          attacker.player === ko.victim.player
            ? 'same'
            : ko.victim.player % 2 === 0
              ? 'right'
              : 'left';
      }

      return {
        turn: ko.turn,
        left,
        right,
        direction,
        label,
        indirect: ko.indirect,
        summary: buildKOSummary(ko.victim, attacker, label, ko.indirect),
      };
    }),
  );

  protected readonly hasKOTimeline = computed(
    () => this.koTimeline().length > 0,
  );

  protected readonly timelineTeams = computed(() => {
    const roster = this.players();
    const pick = (parity: number) =>
      roster
        .filter((_, index) => (index + 1) % 2 === parity)
        .map((player) => player.username)
        .join(' & ');
    return { left: pick(1), right: pick(0) };
  });

  protected readonly chartPlayers = computed(
    () => this.analysis()?.players ?? [],
  );

  constructor() {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const replay = params['replay'];
        if (typeof replay === 'string') {
          this.replayURI.set(decodeURIComponent(replay));
          this.analyze();
        }
      });
  }

  protected analyze(): void {
    this.run(this.replayURI().trim());
  }

  protected load(entry: ReplayHistoryEntry): void {
    this.replayURI.set(entry.uri);
    this.run(entry.uri);
  }

  protected forget(entry: ReplayHistoryEntry): void {
    this.history.remove(entry.id);
  }

  protected async clearHistory(): Promise<void> {
    const count = this.historyEntries().length;
    const confirmed = await this.dialog.confirm('Clear analyzed replays?', {
      message: `This forgets all ${count} replays in the list. The replays themselves are not affected.`,
      confirmLabel: 'Clear',
      confirmColor: 'danger',
    });

    if (confirmed) {
      this.history.clear();
      this.historyFilter.set('');
    }
  }

  protected selectOnFocus(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input?.value) {
      input.select();
    }
  }

  protected selectOnPointerDown(event: PointerEvent): void {
    const input = event.currentTarget as HTMLInputElement;
    if (!input.value || input === document.activeElement) {
      return;
    }
    event.preventDefault();
    input.focus();
    input.select();
  }

  private run(replayURI: string): void {
    if (!replayURI || this.loading()) {
      return;
    }

    this.analyzedURI.set(replayURI);

    const cached = this.history.cached(replayURI);
    if (cached) {
      this.analysis.set(cached);
      this.status.set('ready');
      return;
    }

    this.status.set('loading');

    const analysis$: Observable<{ analysis: ReplayAnalysis }> =
      this.version === 'v2'
        ? this.replayService.analyzeReplayV2(replayURI)
        : this.replayService.analyzeReplay(replayURI);

    analysis$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ analysis }) => {
        this.analysis.set(analysis);
        this.status.set('ready');
        this.history.record(replayURI, analysis);
      },
      error: () => {
        this.analysis.set(undefined);
        this.status.set('error');
      },
    });
  }

  protected setShowDetails(enabled: boolean): void {
    this.showDetails.set(enabled);
    writeDetailsPreference(enabled);
  }
}

function buildKOSummary(
  victim: ReplayKOMon,
  attacker: ReplayKOMon | undefined,
  label: string,
  indirect: boolean,
): string {
  const cause = label ? ` from ${label}` : '';
  if (!attacker) {
    return `${victim.name} fainted${cause}`;
  }
  const kind = indirect ? 'indirectly' : 'directly';
  return `${attacker.name} ${kind} KOed ${victim.name}${cause}`;
}

function readDetailsPreference(): boolean {
  try {
    return localStorage.getItem(DETAILS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeDetailsPreference(enabled: boolean): void {
  try {
    localStorage.setItem(DETAILS_STORAGE_KEY, String(enabled));
  } catch {
    return;
  }
}
