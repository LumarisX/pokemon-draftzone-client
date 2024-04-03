import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteComponent } from '../../images/sprite.component';

@Component({
  selector: 'finder',
  standalone: true,
  imports: [CommonModule, FormsModule, SpriteComponent],
  templateUrl: './finder.component.html',
})
export class FinderComponent {
  constructor() {}
}
