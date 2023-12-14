import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../../pokemon';

@Component({
  selector: 'learnsets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learnsets.component.html'
})
export class LearnsetsComponent {

  @Input() team!: Pokemon[];
}
