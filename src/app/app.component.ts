import { Component } from '@angular/core';
import { AuthService } from './auth/auth0.service';

@Component({
  selector: 'app-root',
  host: { '(document:click)': 'handleClick($event)' },
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
