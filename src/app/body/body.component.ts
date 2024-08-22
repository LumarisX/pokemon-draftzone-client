import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ErrorComponent } from '../error/error.component';

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule, RouterModule, ErrorComponent],
  templateUrl: './body.component.html',
})
export class BodyComponent {
  constructor() {}
}
