import { Component } from '@angular/core';
import { AuthService } from './auth/auth0.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  userDropdown = false;
  menuDropdown = false;

  constructor(public auth: AuthService) {}

  checkTheme() {
    let theme = localStorage.getItem('theme');
    if (theme === 'shiny') {
      return 'shiny';
    }
    return '';
  }
}
