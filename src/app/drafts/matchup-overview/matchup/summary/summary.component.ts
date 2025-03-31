import { Component, Input } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SummaryCoreComponent } from '../../../../util/matchup/summary-core/summary-core.component';
import { Summary } from '../../matchup-interface';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss', '../matchup.scss'],
  imports: [
    CommonModule,
    SummaryCoreComponent,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
})
export class SummaryComponent {
  @Input()
  summaries: Summary[] = [];
  opponent: boolean = false;
}
