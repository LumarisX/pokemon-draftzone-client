import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SliderComponent } from '@pdz/shared/inputs/slider/slider.component';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {
  TimeZone,
  TimezoneSelectComponent,
} from './timezone-select/timezone-select.component';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(advancedFormat);

type Side = 'local' | 'opponent';

@Component({
  selector: 'pdz-time-converter',
  templateUrl: './time_converter.component.html',
  styleUrl: './time_converter.component.scss',
  imports: [
    RouterModule,
    FormsModule,
    ClipboardModule,
    IconComponent,
    SliderComponent,
    TimezoneSelectComponent,
  ],
})
export class TimeConverterComponent {
  timeZones: TimeZone[] = Intl.supportedValuesOf('timeZone')
    .map((tz) => this.describeZone(tz))
    .sort((a, b) => a.offset - b.offset);

  timeZonesShort: TimeZone[] = this.timeZones.reduce((acc, tz) => {
    if (tz.short && !acc.find((t) => t.short === tz.short)) {
      acc.push(tz);
    }
    return acc;
  }, [] as TimeZone[]);

  localZone: TimeZone = this.describeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  opponentZone: TimeZone = this.localZone;

  localDate = dayjs().format('YYYY-MM-DD');
  localTime = dayjs().format('HH:mm');
  opponentDate = this.localDate;
  opponentTime = this.localTime;

  copied = false;

  private describeZone(name: string): TimeZone {
    const short = new Intl.DateTimeFormat('en-US', {
      timeZone: name,
      timeZoneName: 'short',
    })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value;
    return {
      short,
      name,
      offset: dayjs().tz(name).utcOffset(),
      utc: dayjs().tz(name).format('UTCZ'),
    };
  }

  get localMinutes(): number {
    return this.toMinutes(this.localTime);
  }

  set localMinutes(value: number) {
    this.localTime = this.fromMinutes(value);
    this.sync('local');
  }

  get opponentMinutes(): number {
    return this.toMinutes(this.opponentTime);
  }

  set opponentMinutes(value: number) {
    this.opponentTime = this.fromMinutes(value);
    this.sync('opponent');
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private fromMinutes(value: number): string {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private instant(side: Side) {
    const date = side === 'local' ? this.localDate : this.opponentDate;
    const time = side === 'local' ? this.localTime : this.opponentTime;
    const zone = side === 'local' ? this.localZone : this.opponentZone;
    return dayjs.tz(`${date}T${time}:00`, zone.name);
  }

  sync(from: Side): void {
    const target = from === 'local' ? this.opponentZone : this.localZone;
    const converted = this.instant(from).tz(target.name);
    if (from === 'local') {
      this.opponentDate = converted.format('YYYY-MM-DD');
      this.opponentTime = converted.format('HH:mm');
    } else {
      this.localDate = converted.format('YYYY-MM-DD');
      this.localTime = converted.format('HH:mm');
    }
  }

  setZone(side: Side, zone: TimeZone): void {
    if (side === 'local') {
      this.localZone = zone;
    } else {
      this.opponentZone = zone;
    }
    this.sync('local');
  }

  formatDisplay(side: Side): string {
    const date = side === 'local' ? this.localDate : this.opponentDate;
    const time = side === 'local' ? this.localTime : this.opponentTime;
    return dayjs(`${date}T${time}`).format('dddd, MMMM D, YYYY hh:mm A');
  }

  get discordTimestamp(): string {
    return `<t:${this.instant('local').format('X')}:f>`;
  }

  copy(): void {
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 1500);
  }
}
