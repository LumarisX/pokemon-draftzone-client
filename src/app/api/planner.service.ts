import { Injectable } from '@angular/core';
import { PokemonId } from '../pokemon';
import { ApiService } from './api.service';
import { Observable, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlannerService {
  private cacheSize: number = 10;
  private cache: { key: string; data: string }[] = new Array(this.cacheSize);
  private currentIndex: number = 0;

  constructor(private apiService: ApiService) {}

  getPlannerDetails(team: PokemonId[]): Observable<any> {
    const cacheKey = JSON.stringify(team);
    const cachedData = this.cache.find((item) => item && item.key === cacheKey);
    if (cachedData) {
      return of(cachedData.data);
    } else {
      return this.apiService.get(`planner?team=${team}`, false).pipe(
        map((data: any) => {
          this.cache[this.currentIndex] = { key: cacheKey, data: data };
          this.currentIndex = (this.currentIndex + 1) % this.cacheSize;
          return data;
        })
      );
    }
  }
}
