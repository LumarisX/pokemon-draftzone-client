import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  constructor() {}
}
