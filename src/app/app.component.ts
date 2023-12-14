import { Component, OnInit, inject } from '@angular/core';
import { ServerService } from './server.service';
import { Draft } from './team';

@Component({
  selector: 'app-root',
  template: `
    <h1>{{ title }}</h1>
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
