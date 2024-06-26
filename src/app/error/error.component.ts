import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../images/sprite.component';

@Component({
  selector: 'error',
  standalone: true,
  imports: [CommonModule, RouterModule, SpriteComponent, ReactiveFormsModule],
  templateUrl: './error.component.html',
})
export class ErrorComponent {
  constructor() {}
}
