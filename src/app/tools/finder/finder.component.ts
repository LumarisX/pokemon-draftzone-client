import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { Pokemon } from '../../interfaces/draft';
import { SpriteComponent } from '../../images/sprite.component';
import { FindOptionComponent } from './find-option/find-option.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
export class FinderComponent implements OnInit {
  results: Pokemon[] = [];
  queries: string[] = []; // Store query strings from each FindOptionComponent
  finalQuery: string = '';

  constructor(
    private route: ActivatedRoute,
    private dataApi: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.addFindOption(); // Add the first FindOptionComponent on initialization
  }

  addFindOption() {
    this.queries.push(''); // Initialize an empty query for the new FindOptionComponent
  }

  removeFindOption(index: number) {
    this.queries.splice(index, 1);
    this.updateFinalQuery();
  }

  onQueryChange(index: number, queryString: string) {
    this.queries[index] = queryString; // Update the query at the specified index
    this.updateFinalQuery(); // Update the final query
  }

  updateFinalQuery() {
    this.finalQuery = this.queries.filter(Boolean).join(' && '); // Combine queries with '&&'
  }

  find() {
    this.dataApi
      .advancesearch([this.finalQuery], 'Gen9 NatDex')
      .subscribe((data) => (this.results = data));
  }
}
