import { Injectable, OnInit } from '@angular/core';
import { Pokemon } from '../interfaces/draft';
import { Pokedex } from '../pokedex';
@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private nameList: Pokemon[] = [];

  constructor() {
    for (const key in Pokedex) {
      this.nameList.push({ name: Pokedex[key].name[0], pid: key });
    }
    this.nameList.sort((a, b) => a.name.localeCompare(b.name));
  }

  getResults(query: string) {
    if (query != '') {
      const lowerCaseQuery = query.toLowerCase();
      return this.nameList.filter((mon) =>
        mon.name.toLowerCase().startsWith(lowerCaseQuery)
      );
    } else {
      return [];
    }
  }

  sendQuery() {}
}
