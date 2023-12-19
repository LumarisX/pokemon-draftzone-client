import { CommonModule,OnInit } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../../pokemon';

@Component({
  selector: 'speedchart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speedchart.component.html'
})
export class SpeedchartComponent implements OnInit {

  @Input() myTeam!: Pokemon[];
  @Input() oppTeam!: Pokemon[];
  
  ngOnInit() {
    //document.getElementById("base").scrollIntoView()
  }
}
