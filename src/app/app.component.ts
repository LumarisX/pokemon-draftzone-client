import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth0.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  userDropdown = false;
  menuDropdown = false;
  theme: undefined | string;

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    let shiny = Math.floor(Math.random() * 100);
    this.theme = shiny === 0 ? 'shiny dark:darkshiny' : '';
  }
}
