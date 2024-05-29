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
  selectedDateTime: string = '';
  selectedTimeZone: string = '';
  currentTimeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
  timeZones: { offset: string; name: string }[] = moment.tz
    .names()
    .filter((tz) => !tz.toLowerCase().includes('etc/'))
    .map((tz) => ({
      offset: moment.tz(tz).format('UTC Z'),
      name: tz,
    }));

  filteredTimeZones: { offset: string; name: string }[] = this.timeZones;
  timeZoneSearchQuery: string = '';
  localTime: string = '';
  convertedTime: string = '';

  ngOnInit() {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().slice(0, 10);
    const currentTimeString = currentDate.toTimeString().slice(0, 5);
    this.selectedDateTime = `${currentDateString}T${currentTimeString}`;
    this.selectedTimeZone = this.currentTimeZone;
    this.updateTimes();
  }

  updateTimes() {
    if (this.selectedDateTime && this.selectedTimeZone) {
      const localDateTime = moment(this.selectedDateTime);
      this.localTime = localDateTime.format('YYYY-MM-DD HH:mm:ss');
      const convertedDateTime = localDateTime.clone().tz(this.selectedTimeZone);
      this.convertedTime = convertedDateTime.format('YYYY-MM-DD HH:mm:ss');
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
