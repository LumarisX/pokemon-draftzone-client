import { Component } from '@angular/core';
import { DataService } from '../../api/data.service';
import { Pokemon } from '../../interfaces/draft';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../images/sprite.component';
import { FindOptionComponent } from './find-option/find-option.component';

@Component({
  selector: 'finder',
  standalone: true,
  templateUrl: './finder.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SpriteComponent,
    FindOptionComponent,
  ],
})
export class FinderComponent {
  results: Pokemon[] = [];
  query: string = '';

  constructor(private dataApi: DataService) {}

  updateQuery(newQueryPart: string) {
    this.query = newQueryPart;
  }

  find() {
    this.dataApi
      .advancesearch([this.query], 'Gen9 NatDex')
      .subscribe((data) => (this.results = data));
  }
}
