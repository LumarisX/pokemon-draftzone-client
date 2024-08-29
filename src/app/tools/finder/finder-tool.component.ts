import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinderCoreComponent } from './finder-core.component';
import { DataService } from '../../api/data.service';

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

  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }
}
