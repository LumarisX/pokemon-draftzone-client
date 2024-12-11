import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FinderCoreComponent } from './finder-core.component';
import { DataService } from '../../api/data.service';
import { Location } from '@angular/common';

@Component({
  selector: 'finder-tool',
  standalone: true,
  templateUrl: './finder-tool.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FinderCoreComponent,
  ],
})
export class FinderToolComponent implements OnInit {
  formats: string[] = [];
  rulesets: string[] = [];
  queryParamValue: string | null = null;

  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';

  constructor(
    private dataService: DataService,
    private location: Location,
    private route: ActivatedRoute,
  ) {}

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

  updateURLQuery(queryValue: string) {
    const currentPath = this.location.path().split('?')[0];
    const updatedUrl = `${currentPath}?format=${this.selectedFormat}&ruleset=${this.selectedRuleset}&query=${queryValue}`;
    this.location.replaceState(updatedUrl);
  }
}
