import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bz-landing',
  standalone: true,
  templateUrl: './landing.component.html',
  imports: [CommonModule, RouterModule],
})
export class BZLandingComponent {
  constructor() {}
}
