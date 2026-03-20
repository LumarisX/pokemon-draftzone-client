import { Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import {
  PokemonSearchCoreComponent,
  SearchPokemonRequest,
} from './pokemon-search-core/pokemon-search-core.component';

@Component({
  selector: 'pdz-pokemon-search',
  standalone: true,
  templateUrl: './pokemon-search.component.html',
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    PokemonSearchCoreComponent,
  ],
})
export class PokemonSearchComponent implements OnInit {
  private dataService = inject(DataService);
  private location = inject(Location);
  private route = inject(ActivatedRoute);

  formats: string[] = [];
  rulesets: string[] = [];
  queryParamValue: string | null = null;

  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';

  ngOnInit() {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });

    this.route.queryParams.subscribe((params) => {
      this.queryParamValue = params['query'] || null;
      if (params['format']) this.selectedFormat = params['format'];
      if (params['ruleset']) this.selectedRuleset = params['ruleset'];
    });
  }

  updateURLQuery(queryValue: SearchPokemonRequest) {
    const currentPath = this.location.path().split('?')[0];
    const compactQuery = this.compactQueryForUrl(queryValue);
    const queryParts = [
      `format=${encodeURIComponent(this.selectedFormat)}`,
      `ruleset=${encodeURIComponent(this.selectedRuleset)}`,
    ];

    if (compactQuery) {
      queryParts.push(`query=${encodeURIComponent(compactQuery)}`);
    }

    const updatedUrl = `${currentPath}?${queryParts.join('&')}`;
    this.location.replaceState(updatedUrl);
  }

  private compactQueryForUrl(queryValue: SearchPokemonRequest): string {
    return JSON.stringify(queryValue);
  }
}
