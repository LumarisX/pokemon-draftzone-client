import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from './auth/auth0.service';

@Component({
  selector: 'app-root',
  host: { '(document:click)': 'handleClick($event)' },
  templateUrl: './app.component.html',
})
export class AppComponent {
  @ViewChild('loginpopup') private loginpopup!: ElementRef;
  showOption: boolean = false;

  constructor(public auth: AuthService) {}

  handleClick(event: { target: any }) {
    if (this.showOption) {
      let clickedComponent = event.target;
      if (clickedComponent !== this.loginpopup.nativeElement) {
        this.showOption = false;
      }
    }
  }

  toggleOption() {
    this.showOption = this.showOption === true ? false : true;
  }
}
