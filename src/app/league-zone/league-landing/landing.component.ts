
import { Component } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'pdz-league-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  imports: [MatRippleModule, RouterModule],
})
export class LeagueLandingComponent {
  constructor() {}
}
