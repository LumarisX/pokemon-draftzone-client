import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  constructor() {}
}
