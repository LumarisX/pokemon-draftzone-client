import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DataService, SupporterData } from '../../api/data.service';
import { BallSVG } from '../../images/svg-components/ball.component';

@Component({
  selector: 'supporters',
  standalone: true,
  imports: [CommonModule, RouterModule, BallSVG],
  templateUrl: './supporters.component.html',
})
export class SupportersComponent implements OnInit {
  supporterData!: SupporterData;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getSupporters().subscribe((data) => {
      this.supporterData = data;
    });
  }
}
