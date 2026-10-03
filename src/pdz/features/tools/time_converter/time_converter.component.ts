import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TimeConverterComponent } from '@pdz/shared/time/time-converter/time-converter.component';

@Component({
  selector: 'pdz-time-converter-page',
  templateUrl: './time_converter.component.html',
  styleUrl: './time_converter.component.scss',
  imports: [
    CardComponent,
    PageComponent,
    PageHeaderComponent,
    TimeConverterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeConverterPageComponent {}
