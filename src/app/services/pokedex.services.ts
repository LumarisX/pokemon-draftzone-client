import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Pokedex {
  private apiUrl = 'http://localhost:9960/data/namelist?ruleset=';
  private data: any[] = [];

  constructor(private http: HttpClient, private ruleset: string) {
    this.loadData();
  }

  private loadData(): void {
    const url = `${this.apiUrl}"${this.ruleset}"`;
    this.http.get<any[]>(url).subscribe({
      next: (response) => {
        this.data = response;
      },
      error: (error) => {
        console.error('Error loading data:', error);
      },
    });
  }

  getName(pid: string): string {
    const specie = this.data.find(([pokemonId, name]) => pokemonId === pid);
    return specie ? specie[1] : '';
  }
}
