import { inject, Injectable } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { Observable } from 'rxjs';
import type {
  LearnsetMove,
  LearnsetQuery,
  SaveTeamPayload,
  SpeciesBuildData,
  Team,
  TeamContextType,
} from './teambuilder.models';

const TEAMS_PATH = 'teambuilder/teams';

@Injectable({ providedIn: 'root' })
export class TeambuilderService {
  private readonly api = inject(ApiService);

  getSpecies(id: string, ruleset: string): Observable<SpeciesBuildData> {
    return this.api.get<SpeciesBuildData>(
      ['teambuilder', 'species', encodeURIComponent(id)],
      { params: { ruleset } },
    );
  }

  getLearnset(query: LearnsetQuery): Observable<LearnsetMove[]> {
    return this.api.get<LearnsetMove[]>(
      ['teambuilder', 'species', encodeURIComponent(query.id), 'learnset'],
      {
        params: {
          ruleset: query.ruleset,
          types: query.types.join(','),
          ability: query.ability ?? '',
          teraType: query.teraType ?? '',
        },
      },
    );
  }

  listTeams(type: TeamContextType, id: string): Observable<Team[]> {
    return this.api.get<Team[]>(TEAMS_PATH, {
      params: { contextType: type, contextId: id },
    });
  }

  createTeam(payload: SaveTeamPayload): Observable<Team> {
    return this.api.post<Team>(TEAMS_PATH, payload, {
      invalidateCache: [TEAMS_PATH],
    });
  }

  saveTeam(slug: string, payload: SaveTeamPayload): Observable<Team> {
    return this.api.put<Team>([TEAMS_PATH, slug], payload, {
      invalidateCache: [TEAMS_PATH],
    });
  }

  deleteTeam(slug: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>([TEAMS_PATH, slug], {
      invalidateCache: [TEAMS_PATH],
    });
  }
}
