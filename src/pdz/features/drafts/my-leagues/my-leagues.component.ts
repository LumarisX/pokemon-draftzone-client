import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LEAGUE_ADS_PATH } from '@pdz/core/route-paths';
import { EXTERNAL_DRAFTS_AREA } from '@pdz/features/drafts/draft-area';
import { Archive } from '@pdz/features/drafts/draft-overview/archive.model';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { Draft } from '@pdz/features/drafts/draft.model';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { RosterSpritesComponent } from '@pdz/shared/images/roster-sprites/roster-sprites.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import {
  activeOrder,
  feedFrom,
  fromArchive,
  fromDraft,
  fromOrganized,
  fromTournament,
  LeagueEntry,
  leagueLine,
  ordinal,
  PHASE_LABEL,
  time,
} from './my-leagues.model';

type YearGroup = {
  year: string;
  entries: LeagueEntry[];
  titles: number;
  wins: number;
  losses: number;
};

type LoadResult = { entries: LeagueEntry[]; failed: boolean };

function completedTime(entry: LeagueEntry): number {
  return entry.completedAt ? new Date(entry.completedAt).getTime() : 0;
}

@Component({
  selector: 'pdz-my-leagues',
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    CountdownComponent,
    DisclosureComponent,
    EmptyStateComponent,
    IconComponent,
    PageComponent,
    PageHeaderComponent,
    RecordComponent,
    SkeletonLayoutComponent,
    RosterSpritesComponent,
    TeamComponent,
  ],
  templateUrl: './my-leagues.component.html',
  styleUrl: './my-leagues.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyLeaguesComponent {
  private readonly drafts = inject(DraftService);
  private readonly leagues = inject(LeagueZoneService);

  protected readonly newLink = [...EXTERNAL_DRAFTS_AREA.root, 'new'];
  protected readonly findLink = ['/', LEAGUE_ADS_PATH];
  protected readonly ordinal = ordinal;
  protected readonly leagueLine = leagueLine;
  protected readonly phaseLabel = PHASE_LABEL;

  private readonly attempt = signal(0);

  private readonly load = toSignal(
    toObservable(this.attempt).pipe(
      switchMap(() =>
        forkJoin({
          hosted: this.leagues.getTournamentsList().pipe(
            map((data) => [
              ...data.tournaments.map(fromTournament),
              ...(data.organizing ?? []).map(fromOrganized),
            ]),
            catchError(() => of(null as LeagueEntry[] | null)),
          ),
          external: this.drafts.getDraftsList().pipe(
            map((data) => data.drafts),
            catchError(() => of(null as Draft[] | null)),
          ),
          completed: this.drafts
            .getArchiveList()
            .pipe(catchError(() => of(null as Archive[] | null))),
        }),
      ),
      map(({ hosted, external, completed }): LoadResult => ({
        entries: [
          ...(hosted ?? []),
          ...(external ?? []).map(fromDraft),
          ...(completed ?? []).map(fromArchive),
        ],
        failed: hosted === null || external === null || completed === null,
      })),
    ),
  );

  protected readonly entries = computed(() => this.load()?.entries ?? null);
  protected readonly partialFailure = computed(
    () => !!this.load()?.failed && !!this.load()?.entries.length,
  );
  protected readonly totalFailure = computed(
    () => !!this.load()?.failed && !this.load()?.entries.length,
  );

  protected readonly playing = computed(() =>
    (this.entries() ?? []).filter((entry) => entry.role === 'coach'),
  );

  protected readonly active = computed(() =>
    this.playing()
      .filter((entry) => entry.phase !== 'completed')
      .sort(activeOrder),
  );

  protected readonly organizing = computed(() =>
    (this.entries() ?? [])
      .filter((entry) => entry.role !== 'coach' && entry.phase !== 'completed')
      .sort(activeOrder),
  );

  protected readonly activeCount = computed(
    () => this.active().length + this.organizing().length,
  );

  protected readonly showFeed = false;

  protected readonly feed = computed(() => feedFrom(this.active()));

  protected readonly later = computed(() => {
    const soonest = this.active()
      .filter((entry) => entry.next)
      .sort((a, b) => time(a.next?.when) - time(b.next?.when))[0];
    const next = soonest?.next;
    if (!soonest || !next) return null;
    const when = next.when
      ? new Date(next.when).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      : 'not scheduled yet';
    const versus = next.opponent ? ` vs ${next.opponent}` : '';
    return `Your next match is ${next.round}${versus} (${soonest.league}), ${when}.`;
  });

  protected readonly completed = computed<YearGroup[]>(() => {
    const groups = new Map<string, LeagueEntry[]>();
    (this.entries() ?? [])
      .filter((entry) => entry.phase === 'completed')
      .sort((a, b) => completedTime(b) - completedTime(a))
      .forEach((entry) => {
        const year = entry.completedAt
          ? `${new Date(entry.completedAt).getFullYear()}`
          : 'Earlier';
        groups.set(year, [...(groups.get(year) ?? []), entry]);
      });
    return [...groups.entries()].map(([year, entries]) => ({
      year,
      entries,
      titles: entries.filter((entry) => entry.outcome?.champion).length,
      wins: entries.reduce((sum, entry) => sum + (entry.record?.wins ?? 0), 0),
      losses: entries.reduce(
        (sum, entry) => sum + (entry.record?.losses ?? 0),
        0,
      ),
    }));
  });

  protected readonly completedCount = computed(() =>
    this.completed().reduce((sum, group) => sum + group.entries.length, 0),
  );

  protected readonly career = computed(() => {
    const list = this.playing();
    const wins = list.reduce(
      (sum, entry) => sum + (entry.record?.wins ?? 0),
      0,
    );
    const losses = list.reduce(
      (sum, entry) => sum + (entry.record?.losses ?? 0),
      0,
    );
    const outcomes = list
      .map((entry) => entry.outcome)
      .filter((outcome) => !!outcome)
      .sort((a, b) => a.placement - b.placement);
    return {
      leagues: list.length,
      wins,
      losses,
      rate: wins + losses ? Math.round((wins / (wins + losses)) * 100) : null,
      titles: outcomes.filter((outcome) => outcome.champion).length,
      best: outcomes[0] ?? null,
    };
  });

  protected roleLabel(entry: LeagueEntry): string {
    return entry.role === 'owner' ? 'Owner' : 'Organizer';
  }

  protected retry(): void {
    this.attempt.update((count) => count + 1);
  }

  protected yearLabel(group: YearGroup): string {
    const seasons = `${group.entries.length} ${group.entries.length === 1 ? 'season' : 'seasons'}`;
    const titles = group.titles
      ? ` · ${group.titles} ${group.titles === 1 ? 'title' : 'titles'}`
      : '';
    return `${group.year} · ${seasons}${titles} · ${group.wins}–${group.losses}`;
  }

  protected isFuture(value: string | null | undefined): boolean {
    return !!value && new Date(value).getTime() > Date.now();
  }

  protected draftProgress(entry: LeagueEntry): number {
    const draft = entry.draft;
    if (!draft?.rosterSize) return 0;
    return Math.min(
      100,
      Math.round((draft.picksMade / draft.rosterSize) * 100),
    );
  }

  protected spotsFor(entry: LeagueEntry): number {
    if (entry.phase === 'drafting') return entry.draft?.rosterSize ?? 0;
    if (entry.phase === 'upcoming' && !entry.pokemon.length) return 6;
    return 0;
  }
}
