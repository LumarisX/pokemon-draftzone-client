import { Injectable } from '@angular/core';
import { Namedex } from '../data/namedex';
import { Pokemon } from '../interfaces/draft';
@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private nameList: Pokemon[] = [];

  constructor() {
    for (const key in Namedex) {
      this.nameList.push({ name: Namedex[key].name[0], id: key });
    }
    this.nameList.sort((a, b) => a.name.localeCompare(b.name));
  }

  getResults(query: string) {
    if (query === '') return [];
    return this.nameList.filter((mon) =>
      mon.name.toLowerCase().startsWith(query.toLowerCase())
    );
  }
}
