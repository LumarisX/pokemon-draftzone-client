import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'tools',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  constructor() {}
}
