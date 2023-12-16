import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Draft } from '../../draft';
import { TypeList } from '../../typechart';

@Component({
  selector: 'typechart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typechart.component.html'
})
export class TypechartComponent {

  types = TypeList
  @Input() team!: Draft;
}
