import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../team';
import { TypeList } from '../typechart';

@Component({
  selector: 'typechart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typechart.component.html',
  styleUrl: './typechart.component.css'
})
export class TypechartComponent {

  types = TypeList
  @Input() team!: Team;
}
