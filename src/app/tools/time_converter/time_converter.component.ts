import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { RouterModule } from '@angular/router';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(advancedFormat);

type TimeZone = {
  short?: string;
  name: string;
  utc: string;
  offset: number;
};

@Component({
  selector: 'time-converter',
  standalone: true,
  templateUrl: './time_converter.component.html',
  styleUrl: './time_converter.component.scss',
  providers: [provideNativeDateAdapter()],

  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatTimepickerModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    ClipboardModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatSliderModule,
    MatIconModule,
  ],
})
export class TimeConverterComponent implements OnInit {
  timeZones: TimeZone[] = Intl.supportedValuesOf('timeZone')
    .map((tz) => {
      const date = new Date();
      const short = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value;
      const offset = dayjs().tz(tz).utcOffset();
      return {
        short: short,
        name: tz,
        offset: offset,
        utc: dayjs().tz(tz).format('UTCZ'),
      };
    })
    .sort((a, b) => a.offset - b.offset);
  filteredTZ: TimeZone[] = [...this.timeZones];
  timeZonesShort: TimeZone[] = this.timeZones.reduce((acc, tz) => {
    if (!acc.find((t) => t.short === tz.short)) {
      acc.push(tz);
    }
    return acc;
  }, [] as TimeZone[]);
  filteredTZShort: TimeZone[] = [...this.timeZonesShort];
  baseTimeZone: TimeZone = (() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = new Date();
    const short = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;
    const utc = dayjs().tz(tz).format('UTCZ');
    const offset = dayjs().tz(tz).utcOffset();
    return { short: short, name: tz, utc: utc, offset };
  })();
  localTimeZone: TimeZone = this.baseTimeZone;
  localInput = new FormControl(this.baseTimeZone);
  opponentInput = new FormControl(this.baseTimeZone);
  opponentTimeZone: TimeZone = this.baseTimeZone;
  localDateTime: Date = dayjs().toDate();
  opponentDateTime: Date = dayjs().toDate();

  set localTime(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    this.updateTime(
      'local',
      dayjs(this.localDateTime)
        .set('minutes', minutes)
        .set('hours', hours)
        .toDate(),
    );
  }

  get localTime() {
    return this.localDateTime.getHours() * 60 + this.localDateTime.getMinutes();
  }

  set opponentTime(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    this.updateTime(
      'opponent',
      dayjs(this.opponentDateTime)
        .set('minutes', minutes)
        .set('hours', hours)
        .toDate(),
    );
  }

  get opponentTime() {
    return (
      this.opponentDateTime.getHours() * 60 + this.opponentDateTime.getMinutes()
    );
  }

  ngOnInit() {
    this.localInput.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        this._filter(value);
      } else {
        this.localTimeZone = value || this.baseTimeZone;
      }
    });
    this.opponentInput.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        this._filter(value);
      } else {
        this.opponentTimeZone = value || this.baseTimeZone;
      }
    });
  }

  sliderFn() {
    return '';
  }

  get discordTimestamp() {
    return `<t:${dayjs(this.localDateTime).format('X')}:f>`;
  }

  copied: boolean = false;
  copy() {
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 1500);
  }

  shortFn(value: string | TimeZone): string {
    if (typeof value === 'string') return value;
    return value.short || value.utc;
  }

  private _filter(value: string | null) {
    if (value === '' || value === null) {
      this.filteredTZ = [...this.timeZones];
      this.filteredTZShort = [...this.timeZonesShort];
    } else {
      const lower = value.trim().toLowerCase();
      this.filteredTZ = this.timeZones.filter(
        (tz) =>
          tz.name
            .toLowerCase()
            .split(/\W+/)
            .some((word) => word.startsWith(lower)) ||
          tz.short?.toLowerCase().includes(lower),
      );
      this.filteredTZShort = this.timeZonesShort.filter((tz) =>
        tz.short?.toLowerCase().includes(lower),
      );
    }
  }

  updateTZ(zone: 'local' | 'opponent') {
    this.updateTime(
      zone,
      zone === 'local' ? this.localDateTime : this.opponentDateTime,
    );
  }

  updateTime(zone: 'local' | 'opponent', dateTime: Date | null | undefined) {
    if (!dateTime) return;
    if (zone === 'opponent') {
      this.localDateTime = dayjs(dateTime)
        .add(
          this.localTimeZone.offset - this.opponentTimeZone.offset,
          'minutes',
        )
        .toDate();
      this.opponentDateTime = dateTime;
    } else {
      this.localDateTime = dateTime;
      this.opponentDateTime = dayjs(dateTime)
        .add(
          this.opponentTimeZone.offset - this.localTimeZone.offset,
          'minutes',
        )
        .toDate();
    }
  }

  formatDate(date: Date): string {
    return dayjs(date).format('dddd, MMMM D, YYYY hh:mm A');
  }
}
