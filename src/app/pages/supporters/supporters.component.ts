import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DataService, Supporter } from '../../api/data.service';

@Component({
  selector: 'supporters',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supporters.component.html',
})
export class SupportersComponent implements OnInit {
  poke: Supporter[] = [];
  premier: Supporter[] = [];
  great: Supporter[] = [];
  ultra: Supporter[] = [];
  luxury: Supporter[] = [];
  master: Supporter[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getSupporters().subscribe((data) => {
      data.forEach((supporter) => {
        switch (supporter.tier) {
          case 'Poké Ball':
          case 'Poke Ball':
            this.poke.push(supporter);
            break;
          case 'Premier Ball':
            this.premier.push(supporter);
            break;
          case 'Great Ball':
            this.great.push(supporter);
            break;
          case 'Ultra Ball':
            this.ultra.push(supporter);
            break;
          case 'Luxury Ball':
            this.luxury.push(supporter);
            break;
          case 'Master Ball':
            this.master.push(supporter);
            break;
        }
      });
    });
  }
}
