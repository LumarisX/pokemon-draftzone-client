import { Component } from '@angular/core';
import { TimeConverterComponent } from '@pdz/shared/time/time-converter/time-converter.component';

@Component({
  selector: 'pdz-time-converter-page',
  templateUrl: './time_converter.component.html',
  styleUrl: './time_converter.component.scss',
  imports: [TimeConverterComponent],
})
export class TimeConverterPageComponent {}
