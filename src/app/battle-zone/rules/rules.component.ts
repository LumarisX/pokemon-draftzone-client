import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bz-rules',
  templateUrl: './rules.component.html',
  standalone: true,
  styleUrl: './rules.component.scss',
  imports: [CommonModule, MatExpansionModule, RouterModule],
})
export class BZRulesComponent {
  constructor() {}
}
