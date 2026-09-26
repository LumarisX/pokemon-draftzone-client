import { effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  League,
  TradeData,
  TradeLog,
  TradeStatus,
} from '@pdz/features/league-zone/league.interface';
import { TournamentBracket } from '@pdz/features/league-zone/league-bracket/tournament-bracket.model';
import {
  ChatChannel,
  ChatMessage,
  ChatRoom,
} from '@pdz/features/league-zone/league-chat/league-chat.model';
import {
  MatchupDetail,
  MatchupReportPayload,
} from '@pdz/features/league-zone/league-matchup/league-matchup.model';
import { TournamentDetails } from '@pdz/features/league-zone/league.model';
import { Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ApiService } from '@pdz/core/services/api.service';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import {
  PresignedUpload,
  UploadService,
} from '@pdz/core/services/upload.service';

const ROOTPATH = 'leagues';
const TOURNAMENT_ROOTPATH = 'tournaments';

@Injectable({
  providedIn: 'root',
})
export class LeagueZoneService {
  private apiService = inject(ApiService);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private eventStream = inject(EventStreamService);

  leagueSlug = signal<string | null>(null);
  tournamentSlug = signal<string | null>(null);
  poolSlug = signal<string | null>(null);
  stageSlug = signal<string | null>(null);
  teamSlug = signal<string | null>(null);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.router.routerState.root;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.paramMap),
      )
      .subscribe((paramMap) => {
        const leagueSlug = paramMap.get('leagueSlug');
        this.leagueSlug.set(leagueSlug);
        const tournamentSlug = paramMap.get('tournamentSlug');
        this.tournamentSlug.set(tournamentSlug);
        const poolSlug = paramMap.get('poolSlug');
        this.poolSlug.set(poolSlug);
        const stageSlug = paramMap.get('stageSlug');
        this.stageSlug.set(stageSlug);
        const teamSlug = paramMap.get('teamSlug');
        this.teamSlug.set(teamSlug);
      });

    effect(() => {
      const tournamentSlug = this.tournamentSlug();
      if (tournamentSlug)
        this.eventStream.open(
          `${TOURNAMENT_ROOTPATH}/${tournamentSlug}/draft-events`,
        );
      else this.eventStream.close();
    });
  }

  getTournamentsList() {
    return this.apiService.get<{ tournaments: TournamentDetails[] }>(ROOTPATH);
  }

  getRules(): Observable<League.RuleSection[]> {
    return this.apiService.get<League.RuleSection[]>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/rules`,
    );
  }

  saveRules(
    ruleSections: League.RuleSection[],
  ): Observable<{ message: string }> {
    return this.apiService.put<{ message: string }>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/rules`,
      { ruleSections },
    );
  }

  powerRankingDetails() {
    return this.apiService.get<League.PowerRankingTeam[]>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/pools/${this.poolSlug()}/power-rankings`,
    );
  }

  getPoolDetails(poolSlug?: string) {
    return this.apiService.get<{
      leagueName: string;
      poolName: string;
      teamOrder: string[];
      useRandomSeeding: boolean;
      channelId?: string;
      rounds: number;
      minDraftCount: number;
      tierRequirements: { tierId: string; tierName: string; required: number }[];
      points: number;
      teams: League.LeagueTeam[];
      orderProgression: 'snake' | 'linear';
      sequentialTurns: boolean;
      picksVisibleTo: League.PicksVisibleTo;
      allowDuplicates: boolean;
      picksBlind: boolean;
      canSeeAllPicks: boolean;
      allowRemovals: boolean;
      status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
      noTimer: boolean;
      skipTime: Date;
      currentPick: {
        round: number;
        position: number;
        skipTime?: Date;
      };
      canDraft: string[];
      canDraftCounts: Record<string, number>;
      logo: string;
    }>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/pools/${poolSlug ?? this.poolSlug()}`,
    );
  }

  getTrades() {
    const teamSlug = this.teamSlug();
    return this.apiService.get<{
      rounds: {
        name: string;
        trades: TradeLog[];
      }[];
      currentRoundIndex: number;
      tradePoints: {
        limit: number | null;
        byTeam: { teamId: string; teamName: string; spent: number }[];
      };
    }>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/trades`,
      {
        params: {
          ...(teamSlug ? { teamSlug } : undefined),
        },
      },
    );
  }

  sendTrade(tradeData: TradeData) {
    return this.apiService.post<{ message: string; status: TradeStatus }>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/trades`,
      tradeData,
    );
  }

  updateTrade(
    tradeId: string,
    patch: { status?: 'APPROVED' | 'REJECTED'; activeRound?: number },
  ) {
    return this.apiService.patch<{
      message: string;
      status: TradeStatus;
      activeRound: number;
    }>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/trades/${tradeId}`,
      patch,
    );
  }

  withdrawTrade(tradeId: string) {
    return this.apiService.delete<{ message: string }>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/trades/${tradeId}`,
    );
  }

  getSchedule(params?: { round?: string }) {
    const teamSlug = this.teamSlug();
    return this.apiService.get<{
      rounds: League.ScheduleRound[];
      currentRoundIndex: number;
    }>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/schedule`,
      {
        params: {
          ...(params?.round ? { round: params.round } : undefined),
          ...(teamSlug ? { teamSlug } : undefined),
        },
      },
    );
  }

  draftPokemon(
    teamId: string,
    payload: {
      add?: { pokemonId: string; addons?: string[] }[];
      remove?: string[];
      picks?: { pokemonId: string; addons?: string[] }[][];
    },
  ) {
    return this.apiService.post<
      ReturnType<
        LeagueZoneService['getPoolDetails']
      > extends import('rxjs').Observable<infer T>
        ? T
        : never
    >(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/pools/${this.poolSlug()}/teams/${teamId}/draft`,
      payload,
    );
  }

  getTeamsByPool(): Observable<{
    pools: {
      poolSlug: string | null;
      name: string;
      allowDuplicates: boolean;
      teams: League.LeagueTeam[];
    }[];
  }> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/teams/by-pool`,
    );
  }

  listStages(): Observable<League.StageSummary[]> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/stages`,
    );
  }

  signUp(signupData: object, invite?: string) {
    const query = invite ? `?invite=${encodeURIComponent(invite)}` : '';
    return this.apiService.post<League.SignUpResult>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/signup${query}`,
      signupData,
    );
  }

  getCoachData(options?: {
    suppressStatuses?: number[];
  }): Observable<League.CoachProfile> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/signup`,
      {
        errorHandlingOptions: { suppressStatuses: options?.suppressStatuses },
      },
    );
  }

  getLeagueInfo(): Observable<League.LeagueInfo> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/info`,
    );
  }

  getLeague(
    leagueSlug = this.leagueSlug(),
  ): Observable<League.LeagueSummary> {
    return this.apiService.get(`${ROOTPATH}/${leagueSlug}`);
  }

  getLeagueCapabilities(): Observable<League.LeagueCapabilities> {
    return this.apiService.get(`${ROOTPATH}/capabilities`);
  }

  getOwnedLeagues(): Observable<{ leagues: League.OwnedLeague[] }> {
    return this.apiService.get(`${ROOTPATH}/owned`);
  }

  createLeague(
    payload: League.CreateLeaguePayload,
  ): Observable<{ leagueSlug: string }> {
    return this.apiService.post(ROOTPATH, payload);
  }

  createTournament(
    leagueSlug: string,
    payload: League.CreateTournamentPayload,
  ): Observable<{ tournamentSlug: string }> {
    return this.apiService.post([ROOTPATH, leagueSlug, 'tournaments'], payload);
  }

  getSignUps(): Observable<{
    signups: League.LeagueSignUp[];
    pools: { name: string; poolSlug: string }[];
  }> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/coaches`,
    );
  }

  private organizersPath(): string {
    return `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/organizers`;
  }

  getOrganizers(): Observable<League.TournamentOrganizers> {
    return this.apiService.get(this.organizersPath());
  }

  addOrganizer(body: {
    coachId: string;
  }): Observable<League.TournamentOrganizers> {
    return this.apiService.post(this.organizersPath(), body, {
      invalidateCache: [this.organizersPath()],
    });
  }

  removeOrganizer(sub: string): Observable<League.TournamentOrganizers> {
    return this.apiService.delete(
      `${this.organizersPath()}/${encodeURIComponent(sub)}`,
      { invalidateCache: [this.organizersPath()] },
    );
  }

  renameOrganizer(
    sub: string,
    name: string,
  ): Observable<League.TournamentOrganizers> {
    return this.apiService.patch(
      `${this.organizersPath()}/${encodeURIComponent(sub)}/name`,
      { name },
      { invalidateCache: [this.organizersPath()] },
    );
  }

  createOrganizerInvite(
    name: string,
  ): Observable<League.CreatedOrganizerInvite> {
    return this.apiService.post(
      `${this.organizersPath()}/invites`,
      { name },
      { invalidateCache: [this.organizersPath()] },
    );
  }

  revokeOrganizerInvite(
    inviteId: string,
  ): Observable<League.TournamentOrganizers> {
    return this.apiService.delete(
      `${this.organizersPath()}/invites/${encodeURIComponent(inviteId)}`,
      { invalidateCache: [this.organizersPath()] },
    );
  }

  previewOrganizerInvite(
    tournamentSlug: string,
    token: string,
  ): Observable<League.OrganizerInvitePreview> {
    return this.apiService.post(
      `${TOURNAMENT_ROOTPATH}/${tournamentSlug}/organizer-invites/preview`,
      { token },
    );
  }

  acceptOrganizerInvite(
    tournamentSlug: string,
    token: string,
    name: string,
  ): Observable<{ tournamentSlug: string }> {
    return this.apiService.post(
      `${TOURNAMENT_ROOTPATH}/${tournamentSlug}/organizer-invites/accept`,
      { token, name },
    );
  }

  removeParticipant(coachId: string): Observable<{ message: string }> {
    return this.apiService.delete(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/coaches/${coachId}`,
      {
        invalidateCache: [
          `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/coaches`,
        ],
      },
    );
  }

  decideApplication(
    applicationId: string,
    decision: {
      status: League.SignUpStatus;
      teamName?: string;
    },
  ): Observable<unknown> {
    return this.apiService.patch(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/applications/${applicationId}`,
      decision,
    );
  }

  replaceCoach(
    teamSlug: string,
    body: { applicationId: string; teamName?: string; reason?: string },
  ): Observable<unknown> {
    return this.apiService.post(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/teams/${teamSlug}/replace-coach`,
      body,
    );
  }

  rotateSignUpToken(): Observable<{
    signUpToken: string;
    signUpTokenRotatedAt: string;
  }> {
    return this.apiService.post(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/signup-token/rotate`,
      {},
    );
  }

  updateSignUps(
    signups: {
      teamSlug: string;
      pool?: string;
      status?: League.SignUpStatus;
    }[],
  ): Observable<{ message: string }> {
    return this.apiService.patch(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/teams`,
      {
        assignments: signups.map((s) => ({
          teamSlug: s.teamSlug,
          poolSlug: s.pool || undefined,
          status: s.status,
        })),
      },
    );
  }

  getTournamentBracket(): Observable<TournamentBracket> {
    return this.apiService.get<TournamentBracket>(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/bracket`,
    );
  }

  getTournamentTeams(): Observable<{
    teams: {
      id: string;
      teamName: string;
      coachName: string;
      logo?: string;
      pickCount: number;
      status: League.SignUpStatus;
      pool: { poolSlug: string; name: string } | null;
      roster: { id: string; name: string; cost?: number; tier?: string }[];
    }[];
  }> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/teams`,
    );
  }

  getStandings(): Observable<{
    filters: League.StandingsFilter[];
    views: Record<string, League.StandingsView>;
  }> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/standings`,
    );
  }

  getTeam(teamSlug?: string): Observable<League.LeagueTeam> {
    return this.apiService.get(
      `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/teams/${teamSlug ?? this.teamSlug()}`,
    );
  }

  updateTeam(teamSlug: string, changes: { teamName?: string; logo?: string }) {
    return this.apiService.patch<{ teamName: string; logo: string | null }>(
      this.teamPath(teamSlug),
      changes,
      {
        invalidateCache: [
          this.teamPath(teamSlug),
          `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/signup`,
        ],
      },
    );
  }

  updateCoachProfile(
    coachId: string,
    changes: {
      name?: string;
      gameName?: string;
      discordName?: string;
      timezone?: string;
    },
  ) {
    return this.apiService.patch<{ message: string }>(
      this.coachPath(coachId),
      changes,
      {
        invalidateCache: [
          `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/signup`,
        ],
      },
    );
  }

  private coachPath(coachId: string): string {
    return `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/coaches/${coachId}`;
  }

  private matchupPath(matchupSlug: string): string {
    return `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/matchups/${matchupSlug}`;
  }

  getMatchupDetail(matchupSlug: string): Observable<MatchupDetail> {
    return this.apiService.get<MatchupDetail>(this.matchupPath(matchupSlug));
  }

  submitMatchupReport(
    matchupSlug: string,
    payload: MatchupReportPayload,
  ): Observable<{ message: string; status: 'pending' | 'approved' }> {
    return this.apiService.post(
      `${this.matchupPath(matchupSlug)}/report`,
      payload,
      { invalidateCache: [this.matchupPath(matchupSlug)] },
    );
  }

  setMatchupSchedule(
    matchupSlug: string,
    scheduledDate: string | null,
  ): Observable<{ message: string; scheduledDate: string | null }> {
    return this.apiService.post(
      `${this.matchupPath(matchupSlug)}/schedule`,
      { scheduledDate },
      { invalidateCache: [this.matchupPath(matchupSlug)] },
    );
  }

  reviewMatchupReport(
    matchupSlug: string,
    decision: 'approve' | 'reject',
  ): Observable<{ message: string; status: string }> {
    return this.apiService.post(
      `${this.matchupPath(matchupSlug)}/report/${decision}`,
      {},
      { invalidateCache: [this.matchupPath(matchupSlug)] },
    );
  }

  private chatPath(): string {
    return `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/chat`;
  }

  getChatMessages(channel: ChatChannel, target?: string): Observable<ChatRoom> {
    return this.apiService.get<ChatRoom>(`${this.chatPath()}/${channel}`, {
      params: target ? { target } : {},
    });
  }

  sendChatMessage(
    channel: ChatChannel,
    text: string,
    target?: string,
  ): Observable<{ message: ChatMessage }> {
    return this.apiService.post<{ message: ChatMessage }>(
      `${this.chatPath()}/${channel}`,
      { text, ...(target ? { target } : {}) },
      { invalidateCache: [`${this.chatPath()}/${channel}`] },
    );
  }

  deleteChatMessage(messageId: string): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(
      `${this.chatPath()}/messages/${messageId}`,
      { invalidateCache: [this.chatPath()] },
    );
  }

  private teamPath(teamSlug: string): string {
    return `${TOURNAMENT_ROOTPATH}/${this.tournamentSlug()}/teams/${teamSlug}`;
  }

  getLeagueUploadPresignedUrl(
    filename: string,
    contentType: string,
  ): Observable<PresignedUpload> {
    return this.uploadService.getPresignedUploadUrl(
      filename,
      contentType,
      'team-logos',
    );
  }
}
