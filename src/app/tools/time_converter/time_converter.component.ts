import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

@Component({
  selector: 'time-converter',
  standalone: true,
  templateUrl: './time_converter.component.html',
  imports: [CommonModule, RouterModule, FormsModule],
})
export class TimeConverterComponent implements OnInit {
  selectedDate: string = '';
  selectedTime: string = '';
  opponentTimeZone: string = '';
  localTimeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localTimeOffset: string = dayjs().tz(this.localTimeZone).format('UTCZ');
  timeZones = Intl.supportedValuesOf('timeZone')
    .sort((a, b) => dayjs().tz(a).utcOffset() - dayjs().tz(b).utcOffset())
    .map((tz) => ({
      offset: dayjs().tz(tz).format('UTCZ'),
      name: tz,
    }));
  filteredTimeZones: { offset: string; name: string }[] = this.timeZones;
  convertedTime: string = '';
  convertedDate: string = '';
  timeDifference: string = '';
  timeData = {
    dateTime: dayjs().utc(),
    email: false,
    emailTime: 1,
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const currentDateString = this.timeData.dateTime.format('YYYY-MM-DD');
    const currentTimeString = this.timeData.dateTime.format('HH:mm');
    this.selectedDate = currentDateString;
    this.selectedTime = currentTimeString;
    this.opponentTimeZone = this.localTimeZone;
    this.updateTimes();
  }

  updateTimes(source: 'local' | 'converted' = 'local') {
    if (source === 'local') {
      this.timeData.dateTime = dayjs.tz(
        `${this.selectedDate}T${this.selectedTime}`,
        this.localTimeZone
      );
      console.log(this.localTimeZone, this.opponentTimeZone);

      const convertedDateTime = this.timeData.dateTime
        .clone()
        .tz(this.opponentTimeZone);
      this.convertedTime = convertedDateTime.format('HH:mm');
      this.convertedDate = convertedDateTime.format('YYYY-MM-DD');
    } else if (source === 'converted') {
      const convertedDateTime = dayjs.tz(
        `${this.convertedDate}T${this.convertedTime}`,
        this.opponentTimeZone
      );
      this.timeData.dateTime = convertedDateTime.clone().tz(this.localTimeZone);
      this.selectedTime = this.timeData.dateTime.format('HH:mm');
      this.selectedDate = this.timeData.dateTime.format('YYYY-MM-DD');
    }
    this.calculateTimeDifference(this.timeData.dateTime);
  }

  calculateTimeDifference(localDateTime: Dayjs) {
    if (this.timeData.dateTime.isValid()) {
      const currentTime = dayjs();
      const duration = dayjs.duration(localDateTime.diff(currentTime));
      const isPast = localDateTime.isBefore(currentTime);
      const days = Math.floor(Math.abs(duration.asDays()));
      const hours = Math.abs(duration.hours());
      const timeDifferencePhrase = isPast ? 'ago' : 'from now';
      this.timeDifference =
        days > 0
          ? `${days} days and ${hours} hours ${timeDifferencePhrase}`
          : `${hours} hours ${timeDifferencePhrase}`;
    } else {
      this.timeDifference = 'Invalid date selected';
    }
  }

  filterTimeZones(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredTimeZones = this.timeZones.filter(
      (tz) =>
        tz.offset.toLowerCase().includes(query) ||
        tz.name.toLowerCase().includes(query)
    );
  }
}
