import { Component, OnInit } from '@angular/core';
import { Draft } from './draft';

@Component({
  selector: 'app-root',
  template: `
    <div class="w-full bg-slate-300 border-b-2 border-slate-400">
    <div class="text-xl p-2">{{ title }}</div>
    </div>
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  title = 'DraftZone';
  teams: Draft[] = [];

  constructor() { }

  ngOnInit(): void {
    
  }
}
