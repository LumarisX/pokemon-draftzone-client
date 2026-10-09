import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { UploadService } from '@pdz/core/services/upload.service';
import {
  CoachEditDialogComponent,
  CoachEditDialogData,
  CoachEditDialogResult,
} from '@pdz/features/league-zone/dialogs/coach-edit-dialog/coach-edit-dialog.component';
import {
  TeamEditDialogComponent,
  TeamEditDialogData,
  TeamEditDialogResult,
} from '@pdz/features/league-zone/dialogs/team-edit-dialog/team-edit-dialog.component';
import { LeagueScheduleWidgetComponent } from '@pdz/features/league-zone/league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueTradeWidgetComponent } from '@pdz/features/league-zone/league-widgets/league-trade-widget/league-trade-widget.component';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import {
  getLogoUrl,
  getTeamLogoSrc,
} from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import {
  SeasonMvpComponent,
  SeasonMvpStat,
} from '@pdz/shared/data/season-mvp/season-mvp.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { RosterPatternComponent } from '@pdz/shared/images/roster-pattern/roster-pattern.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { Observable, catchError, interval, map, of, startWith, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, finalize } from 'rxjs/operators';
import {
  TradeProposeDialogComponent,
  TradeProposeDialogData,
  TradeProposeDialogResult,
} from './trade-propose-dialog/trade-propose-dialog.component';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const CLOCK_TICK_MS = 30_000;

@Component({
  selector: 'pdz-league-team',
  imports: [
    ButtonComponent,
    CardComponent,
    ChipComponent,
    EmptyStateComponent,
    IconComponent,
    LeagueScheduleWidgetComponent,
    LeagueTradeWidgetComponent,
    LoadingComponent,
    PageHeaderComponent,
    RecordComponent,
    RosterPatternComponent,
    SeasonMvpComponent,
    SpriteComponent,
    TooltipDirective,
  ],
  templateUrl: './league-team.component.html',
  styleUrl: './league-team.component.scss',
})
export class LeagueTeamComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogs = inject(DialogService);
  private readonly uploadService = inject(UploadService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly tradeWidget = viewChild(LeagueTradeWidgetComponent);

  readonly teamData = signal<League.LeagueTeam | null>(null);
  readonly stageSlug = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');

  private readonly scheduleRounds = signal<League.ScheduleRound[]>([]);
  private readonly currentRoundIndex = signal(0);

  private readonly now = toSignal(
    interval(CLOCK_TICK_MS).pipe(
      startWith(0),
      map(() => new Date()),
    ),
    { initialValue: new Date() },
  );

  readonly coachCurrentTime = computed(() => {
    const timezone = this.teamData()?.timezone;
    if (!timezone) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(this.now());
    } catch {
      return timezone;
    }
  });

  readonly logoSrc = computed(() => getLogoUrl(this.teamData()?.logo));

  readonly totals = computed(() =>
    (this.teamData()?.draft ?? []).reduce(
      (sum, pokemon) => ({
        cost: sum.cost + pokemon.cost,
        kills: sum.kills + (pokemon.record?.kills ?? 0),
        deaths: sum.deaths + (pokemon.record?.deaths ?? 0),
      }),
      { cost: 0, kills: 0, deaths: 0 },
    ),
  );

  readonly mvp = computed(() => {
    const ranked = (this.teamData()?.draft ?? [])
      .filter((pokemon) => (pokemon.record?.kills ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.record?.kills ?? 0) - (a.record?.kills ?? 0) ||
          (a.record?.deaths ?? 0) - (b.record?.deaths ?? 0) ||
          (a.record?.brought ?? 0) - (b.record?.brought ?? 0),
      );
    return ranked[0] ?? null;
  });

  ngOnInit(): void {
    this.leagueService
      .listStages()
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((stages) => this.stageSlug.set(stages[0]?.slug ?? null));

    this.route.paramMap
      .pipe(
        map((params) => params.get('teamSlug')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.teamData.set(null);
        this.loadTeam();
        this.loadSchedule();
      });
  }

  killRatio(pokemon: League.LeaguePokemon): string {
    const kills = pokemon.record?.kills ?? 0;
    const deaths = pokemon.record?.deaths ?? 0;
    if (deaths) return (kills / deaths).toFixed(1);
    return kills > 0 ? `${kills}` : '—';
  }

  readonly mvpStats = computed<SeasonMvpStat[]>(() => {
    const pokemon = this.mvp();
    if (!pokemon) return [];
    const kills = pokemon.record?.kills ?? 0;
    const games = pokemon.record?.brought ?? 0;
    const teamKills = this.totals().kills;
    return [
      { label: 'Games', value: games },
      { label: 'Fainted', value: pokemon.record?.deaths ?? 0 },
      { label: 'KOs/Game', value: games ? (kills / games).toFixed(1) : '—' },
      {
        label: 'Team KOs',
        value: teamKills ? `${Math.round((kills / teamKills) * 100)}%` : '—',
      },
    ];
  });

  async openTeamEdit(): Promise<void> {
    const team = this.teamData();
    if (!team?.isCoach) return;

    const result = await this.dialogs.open<
      TeamEditDialogComponent,
      TeamEditDialogResult,
      TeamEditDialogData
    >(TeamEditDialogComponent, {
      heading: 'Edit Team Info',
      data: { teamName: team.name, logoUrl: getTeamLogoSrc(team.logo) },
    }).closed;

    if (result) this.saveTeamEdit(team, result);
  }

  async openCoachEdit(): Promise<void> {
    const team = this.teamData();
    if (!team?.isCoach) return;

    const result = await this.dialogs.open<
      CoachEditDialogComponent,
      CoachEditDialogResult,
      CoachEditDialogData
    >(CoachEditDialogComponent, {
      heading: 'Edit Coach Info',
      data: {
        name: team.coach,
        gameName: team.gameName ?? '',
        discordName: team.discordName ?? '',
        timezone: team.timezone ?? '',
      },
    }).closed;

    if (result) this.saveCoachEdit(team, result);
  }

  async openTradePropose(): Promise<void> {
    const team = this.teamData();
    if (!team?.isCoach) return;

    const roundIndex = this.currentRoundIndex();
    const result = await this.dialogs.open<
      TradeProposeDialogComponent,
      TradeProposeDialogResult,
      TradeProposeDialogData
    >(TradeProposeDialogComponent, {
      heading: 'New Trade',
      size: 'lg',
      data: {
        teamId: team.id,
        teamName: team.name,
        roster: team.draft,
        rosterCost: this.totals().cost,
        pointTotal: team.pointTotal,
        roundIndex,
        roundName: this.scheduleRounds()[roundIndex]?.name,
      },
    }).closed;

    if (result) this.submitTrade(team.id, result);
  }

  private patchTeam(patch: Partial<League.LeagueTeam>): void {
    this.teamData.update((team) => (team ? { ...team, ...patch } : team));
  }

  private loadTeam(): void {
    this.leagueService
      .getTeam()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.teamData.set(data),
        error: () => this.saveError.set('Could not load this team.'),
      });
  }

  private loadSchedule(): void {
    this.leagueService
      .getSchedule()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.scheduleRounds.set(data.rounds);
          this.currentRoundIndex.set(Math.max(data.currentRoundIndex, 0));
        },
        error: () => this.scheduleRounds.set([]),
      });
  }

  private submitTrade(teamId: string, result: TradeProposeDialogResult): void {
    this.saving.set(true);
    this.saveError.set('');

    this.leagueService
      .sendTrade({
        side1: { team: teamId, pokemon: result.send },
        side2: { pokemon: result.receive },
        roundIndex: result.roundIndex,
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.tradeWidget()?.reload(),
        error: (error) =>
          this.saveError.set(error?.message || 'Could not submit the trade.'),
      });
  }

  private saveTeamEdit(
    team: League.LeagueTeam,
    result: TeamEditDialogResult,
  ): void {
    if (!team.slug) return;
    const teamSlug = team.slug;

    const renamed = result.teamName !== team.name;
    if (!renamed && !result.logoFile) return;

    if (result.logoFile) {
      const invalid = this.validateLogo(result.logoFile);
      if (invalid) {
        this.saveError.set(invalid);
        return;
      }
    }

    this.saving.set(true);
    this.saveError.set('');

    const rename$: Observable<unknown> = renamed
      ? this.leagueService.updateTeam(teamSlug, { teamName: result.teamName })
      : of(null);

    rename$
      .pipe(
        switchMap(() => {
          if (renamed) this.patchTeam({ name: result.teamName });
          return result.logoFile
            ? this.uploadLogo(teamSlug, result.logoFile)
            : of<string | null>(null);
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (logoKey) => {
          if (logoKey) this.patchTeam({ logo: logoKey });
        },
        error: (error) =>
          this.saveError.set(error?.message || 'Could not save team info.'),
      });
  }

  private saveCoachEdit(
    team: League.LeagueTeam,
    result: CoachEditDialogResult,
  ): void {
    if (!team.coachId) return;

    this.saving.set(true);
    this.saveError.set('');

    this.leagueService
      .updateCoachProfile(team.coachId, result)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () =>
          this.patchTeam({
            coach: result.name,
            gameName: result.gameName,
            discordName: result.discordName,
            timezone: result.timezone,
          }),
        error: (error) =>
          this.saveError.set(error?.message || 'Could not save coach info.'),
      });
  }

  private validateLogo(file: File): string | null {
    if (!ALLOWED_LOGO_TYPES.includes(file.type))
      return 'Use a JPEG, PNG, GIF or WebP image.';
    if (file.size > MAX_LOGO_SIZE)
      return `Logos must be under ${MAX_LOGO_SIZE / 1024 / 1024}MB.`;
    return null;
  }

  private uploadLogo(teamSlug: string, file: File): Observable<string | null> {
    return this.leagueService
      .getLeagueUploadPresignedUrl(file.name, file.type || 'image/png')
      .pipe(
        switchMap((presigned) => {
          if (!presigned?.url) throw new Error('Could not start the upload.');
          return this.uploadService.uploadToS3(presigned, file).pipe(
            filter((event) => event.type !== HttpEventType.UploadProgress),
            switchMap((event) => {
              if (!(event instanceof HttpResponse))
                return of<string | null>(null);
              if (!event.ok) throw new Error('The logo upload failed.');
              return this.leagueService
                .updateTeam(teamSlug, { logo: presigned.key })
                .pipe(map(() => presigned.key));
            }),
          );
        }),
      );
  }
}
