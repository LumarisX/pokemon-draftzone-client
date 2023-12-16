import { Component, OnInit } from '@angular/core';
import { Draft } from './draft';

@Component({
  selector: 'app-root',
  template: `
    <header class="w-full bg-slate-300 flex border-b-2 border-slate-400">
      <a class="text-xl p-2">DraftZone</a>
      <div class="flex py-2 px-10 space-x-6">
        <a routerLink="/draft">Draft</a>
        <a>Planner</a>
        <a>Statistics</a>
      </div>
      <div class="flex flex-grow justify-end p-2">Lumaris</div>
    </header>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {

}
