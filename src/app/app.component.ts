import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  host: { '(document:click)': 'handleClick($event)' },
  template: `
    <header class="sticky top-0 w-full bg-slate-300 flex border-b-2 border-slate-400">
      <a class="text-xl p-2">DraftZone</a>
      <div class="flex py-2 px-10 space-x-6">
        <a routerLink="/draft">Draft</a>
        <a>Planner</a>
        <a>Statistics</a>
      </div>
      <div class="flex flex-grow justify-end p-2">
        <div class="actions login__block__actions">
          <div class="dropdown" [ngClass]="{'open':showOption}">
            <div data-toggle="dropdown" (click)="toggleOption()"><div #loginpopup class="px-4">Lumaris</div></div>
            <ul class="absolute bg-slate-300 p-4 dropdown-menu pull-right" *ngIf="this.showOption">
              <li><a data-block="#l-register" href="">Settings</a></li>
              <li><a data-block="#l-forget-password" href="">Sign out</a></li>
            </ul>
          </div>
        </div>
      </div>
    </header>
    <router-outlet></router-outlet>
  `
})

export class AppComponent {

  @ViewChild('loginpopup') private loginpopup!: ElementRef ;
  showOption: boolean = false;

   handleClick(event: { target: any; }) {
       if (this.showOption) {
           let clickedComponent = event.target;
           if ( clickedComponent !== this.loginpopup.nativeElement ) {
               this.showOption = false;
           }
       }
   }

   toggleOption(){
      this.showOption = this.showOption === true ? false : true;
   }

}
