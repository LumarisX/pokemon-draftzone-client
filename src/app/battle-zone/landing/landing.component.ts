import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bz-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  imports: [CommonModule, MatRippleModule, RouterModule],
})
export class BZLandingComponent {
  constructor() {}
}
