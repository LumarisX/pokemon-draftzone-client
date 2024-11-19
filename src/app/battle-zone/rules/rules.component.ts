import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ZSVG } from '../../images/svg-components/z.component';

@Component({
  selector: 'bz-rules',
  templateUrl: './rules.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, ZSVG],
})
export class BZRulesComponent {
  transactions = 5;
  points = 120;
  teraPoints = 25;
  constructor() {}
}
