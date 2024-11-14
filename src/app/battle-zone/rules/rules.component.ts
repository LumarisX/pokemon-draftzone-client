import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bz-rules',
  templateUrl: './rules.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class BZRulesComponent {
  constructor() {}
}
