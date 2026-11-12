import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { Observable } from 'rxjs';
import { IdentityPack, SavedIdentity } from './team-identity.model';

@Injectable({ providedIn: 'root' })
export class TeamIdentityService {
  private readonly api = inject(ApiService);

  packs(): Observable<IdentityPack[]> {
    return this.api.get<IdentityPack[]>('team-identities');
  }

  rename(id: string, name: string): Observable<SavedIdentity> {
    return this.api.patch<SavedIdentity>(['team-identities', 'mine', id], {
      name,
    });
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(['team-identities', 'mine', id]);
  }

  mine(): Observable<SavedIdentity[]> {
    return this.api.get<SavedIdentity[]>(['team-identities', 'mine'], {
      errorHandlingOptions: { suppressStatuses: [401] },
    });
  }
}
