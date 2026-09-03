import { computed, inject, Injectable, signal } from '@angular/core';
import {
  createSet,
  getStatSystem,
  hasMove,
  LegalityIssue,
  NameResolver,
  PokemonSet,
  maxStat,
  setNature,
  setStats,
  spentPoints,
  Stat,
  StatSystem,
  StatsTable,
  toID,
  validateSet,
  wastedEvs,
  withIv,
  withMove,
  withNature,
  withPoints,
  withTargetStat,
} from '@pdz/sets';
import { firstValueFrom } from 'rxjs';
import type {
  SaveTeamPayload,
  SpeciesBuildData,
  Team,
  TeamContext,
} from '../data/teambuilder.models';
import { TeambuilderService } from '../data/teambuilder.service';
import {
  clearLegacyTeams,
  forgetPending,
  legacySetToPokemonSet,
  pendingFor,
  readLegacyTeams,
  rememberPending,
} from './team-cache';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 500;
const MAX_SETS = 24;

@Injectable()
export class TeamStore {
  private readonly service = inject(TeambuilderService);

  private readonly context = signal<TeamContext | null>(null);
  private readonly slug = signal<string | null>(null);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private loadKey: string | null = null;
  private loading: Promise<void> | null = null;

  readonly ruleset = signal('');
  readonly level = signal(100);
  readonly statRules = signal<StatSystem>(getStatSystem(undefined));
  readonly sets = signal<readonly PokemonSet[]>([]);
  readonly activeIndex = signal(0);
  readonly status = signal<SyncStatus>('idle');
  readonly species = signal<ReadonlyMap<string, SpeciesBuildData>>(new Map());
  private readonly moveNames = signal<ReadonlyMap<string, string>>(new Map());

  readonly names = computed<NameResolver>(() => {
    const species = this.species();
    const moves = this.moveNames();

    const abilities = new Map<string, string>();
    const items = new Map<string, string>();
    for (const data of species.values()) {
      for (const ability of data.abilities) abilities.set(toID(ability), ability);
      for (const item of data.items) items.set(item.id, item.name);
    }

    return {
      species: (id) => species.get(id)?.name ?? id,
      ability: (id) => abilities.get(id) ?? id,
      item: (id) => items.get(id) ?? id,
      move: (id) => moves.get(id) ?? id,
    };
  });

  readonly activeSet = computed<PokemonSet | null>(
    () => this.sets()[this.activeIndex()] ?? null,
  );

  readonly activeSpecies = computed<SpeciesBuildData | null>(() => {
    const set = this.activeSet();
    return set ? (this.species().get(set.id) ?? null) : null;
  });

  readonly issues = computed<LegalityIssue[][]>(() => {
    const rules = this.statRules();
    return this.sets().map((set) => validateSet(set, rules));
  });

  readonly activeIssues = computed<LegalityIssue[]>(
    () => this.issues()[this.activeIndex()] ?? [],
  );

  readonly activeStats = computed<StatsTable | null>(() => {
    const set = this.activeSet();
    const species = this.activeSpecies();
    if (!set || !species) return null;
    return setStats(set, this.statRules(), species.baseStats);
  });

  readonly spent = computed(() => {
    const set = this.activeSet();
    return set ? spentPoints(set, this.statRules()) : 0;
  });

  readonly remaining = computed(() => this.statRules().total - this.spent());

  readonly wasted = computed(() => {
    const set = this.activeSet();
    return set ? wastedEvs(set, this.statRules()) : 0;
  });

  readonly isFull = computed(() => this.sets().length >= MAX_SETS);

  async load(
    context: TeamContext,
    ruleset: string,
    level: number,
  ): Promise<void> {
    const key = `${context.type}:${context.id}:${ruleset}:${level}`;
    if (this.loadKey === key) return this.loading ?? Promise.resolve();
    this.loadKey = key;
    this.loading = this.loadContext(context, ruleset, level);
    return this.loading;
  }

  private async loadContext(
    context: TeamContext,
    ruleset: string,
    level: number,
  ): Promise<void> {
    this.context.set(context);
    this.ruleset.set(ruleset);
    this.level.set(level);

    await this.migrateLegacy(ruleset, level);

    const teams = await firstValueFrom(
      this.service.listTeams(context.type, context.id),
    );
    const team = teams[0] ?? null;
    if (!team) {
      this.slug.set(null);
      this.sets.set([]);
      this.activeIndex.set(0);
      return;
    }

    this.adopt(team);
    const pending = pendingFor(team.slug);
    if (pending) {
      this.sets.set(pending.payload.sets.map((set) => createSet(set)));
      this.queueSave();
    }
  }

  addSet(id: string, options: Partial<PokemonSet> = {}): number {
    const species = this.species().get(id);
    const set = createSet({
      id,
      level: this.level(),
      ability: species?.abilities[0] ? toID(species.abilities[0]) : undefined,
      teraType: species?.teraType,
      ...options,
    });
    const next = [...this.sets(), set];
    this.sets.set(next);
    this.queueSave();
    return next.length - 1;
  }

  removeSet(index: number): void {
    const next = this.sets().filter((_, i) => i !== index);
    this.sets.set(next);
    if (this.activeIndex() >= next.length) {
      this.activeIndex.set(Math.max(0, next.length - 1));
    }
    this.queueSave();
  }

  hasSpecies(id: string): boolean {
    return this.sets().some((set) => set.id === id);
  }

  rememberSpecies(data: SpeciesBuildData): void {
    const next = new Map(this.species());
    next.set(data.id, data);
    this.species.set(next);
    this.statRules.set(getStatSystem(data.statSystem));
  }

  rememberMoveNames(moves: readonly { id: string; name: string }[]): void {
    if (moves.length === 0) return;
    const next = new Map(this.moveNames());
    let changed = false;
    for (const move of moves) {
      if (next.get(move.id) === move.name) continue;
      next.set(move.id, move.name);
      changed = true;
    }
    if (changed) this.moveNames.set(next);
  }

  updateAt(index: number, update: (set: PokemonSet) => PokemonSet): void {
    const current = this.sets()[index];
    if (!current) return;
    const next = [...this.sets()];
    next[index] = update(current);
    this.sets.set(next);
    this.queueSave();
  }

  updateActive(update: (set: PokemonSet) => PokemonSet): void {
    this.updateAt(this.activeIndex(), update);
  }

  statsFor(index: number): StatsTable | null {
    const set = this.sets()[index];
    const species = set ? this.species().get(set.id) : undefined;
    if (!set || !species) return null;
    return setStats(set, this.statRules(), species.baseStats);
  }

  maxStatFor(index: number, stat: Stat): number | null {
    const set = this.sets()[index];
    const species = set ? this.species().get(set.id) : undefined;
    if (!set || !species) return null;
    return maxStat(
      stat,
      species.baseStats[stat],
      set.level,
      this.statRules(),
      setNature(set),
    );
  }

  setTargetStatAt(index: number, stat: Stat, target: number): void {
    const set = this.sets()[index];
    const species = set ? this.species().get(set.id) : undefined;
    if (!set || !species) return;
    this.updateAt(index, (current) =>
      withTargetStat(
        current,
        this.statRules(),
        stat,
        species.baseStats[stat],
        target,
      ),
    );
  }

  setNatureAt(index: number, boost: Stat, drop: Stat): void {
    this.updateAt(index, (set) => withNature(set, boost, drop));
  }

  setPoints(stat: Stat, value: number): void {
    this.updateActive((set) => withPoints(set, this.statRules(), stat, value));
  }

  setIv(stat: Stat, value: number): void {
    this.updateActive((set) => withIv(set, stat, value));
  }

  setNature(boost: Stat, drop: Stat): void {
    this.updateActive((set) => withNature(set, boost, drop));
  }

  setTargetStat(stat: Stat, target: number): void {
    this.setTargetStatAt(this.activeIndex(), stat, target);
  }

  toggleMove(slot: number, moveId: string | null): void {
    this.updateActive((set) => {
      if (moveId && hasMove(set, moveId)) {
        const existing = set.moves.findIndex(
          (move) => move !== null && toID(move) === toID(moveId),
        );
        return withMove(set, existing, null);
      }
      return withMove(set, slot, moveId);
    });
  }

  private adopt(team: Team): void {
    this.slug.set(team.slug);
    this.sets.set(team.sets.map((set) => createSet(set)));
    this.activeIndex.set(0);
    if (team.ruleset) this.ruleset.set(team.ruleset);
    if (team.level) this.level.set(team.level);
  }

  private payload(): SaveTeamPayload {
    return {
      context: this.context() ?? { type: 'standalone', id: '' },
      name: '',
      ruleset: this.ruleset(),
      level: this.level(),
      sets: [...this.sets()],
    };
  }

  queueSave(): void {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush();
    }, SAVE_DEBOUNCE_MS);
  }

  async flush(): Promise<void> {
    if (!this.context()) return;
    const payload = this.payload();
    const slug = this.slug();
    this.status.set('saving');
    try {
      const team = slug
        ? await firstValueFrom(this.service.saveTeam(slug, payload))
        : await firstValueFrom(this.service.createTeam(payload));
      this.slug.set(team.slug);
      forgetPending(team.slug);
      this.status.set('saved');
    } catch {
      if (slug) rememberPending(slug, payload);
      this.status.set('error');
    }
  }

  private async migrateLegacy(ruleset: string, level: number): Promise<void> {
    const legacy = readLegacyTeams();
    if (legacy.length === 0) return;
    for (const team of legacy) {
      const sets = team.sets
        .map((set) => legacySetToPokemonSet(set, level))
        .filter((set): set is PokemonSet => set !== null);
      if (sets.length === 0) continue;
      try {
        await firstValueFrom(
          this.service.createTeam({
            context: team.context,
            name: '',
            ruleset,
            level,
            sets,
          }),
        );
      } catch {
        return;
      }
    }
    clearLegacyTeams();
  }
}
