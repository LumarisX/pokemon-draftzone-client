import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment-timezone';

@Component({
  selector: 'opponent-schedule',
  standalone: true,
  templateUrl: './opponent-schedule.component.html',
  imports: [CommonModule, FormsModule],
})
export class OpponentSchedule implements OnInit {
  selectedDate: string = '';
  selectedTime: string = '';
  opponentTimeZone: string = '';
  emailReminder: boolean = true;
  localTimeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localTimeOffset: string = moment.tz(this.localTimeZone).format('UTCZ');
  timeZones: { offset: string; name: string }[] = moment.tz
    .names()
    .filter((tz) => !tz.toLowerCase().includes('etc/'))
    .sort((a, b) => moment.tz(a).utcOffset() - moment.tz(b).utcOffset())
    .map((tz) => ({
      offset: moment.tz(tz).format('UTCZ'),
      name: tz,
    }));

  filteredTimeZones: { offset: string; name: string }[] = this.timeZones;
  timeZoneSearchQuery: string = '';
  localTime: string = '';
  convertedTime: string = '';
  timeDifference: string = '';
  format: '12' | '24' = '12';

  ngOnInit() {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().slice(0, 10);
    const currentTimeString = currentDate.toTimeString().slice(0, 5);
    this.selectedDate = currentDateString; // Initialize selectedDate
    this.selectedTime = currentTimeString; // Initialize selectedTime
    this.opponentTimeZone = this.localTimeZone;
    this.updateTimes();
    console.log(this.timeZones);
  }

  updateTimes() {
    if (this.selectedDate && this.selectedTime && this.opponentTimeZone) {
      const selectedDateTime = `${this.selectedDate}T${this.selectedTime}`; // Combine date and time
      const localDateTime = moment(selectedDateTime);
      const convertedDateTime = localDateTime.clone().tz(this.opponentTimeZone);
      if (this.format === '12') {
        this.localTime = localDateTime.format('MM/DD/YYYY hh:mm A');
        this.convertedTime = convertedDateTime.format('MM/DD/YYYY  hh:mm A');
      } else {
        this.localTime = localDateTime.format('MM/DD/YYYY HH:mm');
        this.convertedTime = convertedDateTime.format('MM/DD/YYYY  HH:mm');
      }
      this.calculateTimeDifference(localDateTime);
    }
  }

  calculateTimeDifference(localDateTime: moment.Moment) {
    const currentTime = moment();
    const duration = moment.duration(localDateTime.diff(currentTime));

    const isPast = localDateTime.isBefore(currentTime);
    const days = Math.floor(Math.abs(duration.asDays()));
    const hours = Math.abs(duration.hours());

    const timeDifferencePhrase = isPast ? 'ago' : 'from now';
    this.timeDifference = `${days} days and ${hours} hours ${timeDifferencePhrase}`;
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
