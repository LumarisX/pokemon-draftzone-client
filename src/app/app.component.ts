import { Component, OnInit, inject } from '@angular/core';
import { ServerService } from './server.service';
import { Team } from './team';

@Component({
  selector: 'app-root',
  template: `
    <h1>{{ title }}</h1>
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  title = 'DraftZone';
  teams: Team[] = [];
  serverService: ServerService = inject(ServerService);

  constructor() { }

  ngOnInit(): void {
    this.serverService.getLeagues().subscribe(data => {
      this.teams = <Team[]>data;
    });
  }
}
