import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment-timezone';

@Component({
  selector: 'opponent-schedule',
  standalone: true,
  templateUrl: './opponent-schedule.component.html',
  imports: [CommonModule, FormsModule],
})
export class OpponentSchedule {
  selectedDateTime: string = '';
  selectedTimeZone: string = '';
  timeZones: string[] = moment.tz.names();
  filteredTimeZones: string[] = this.timeZones;
  timeZoneSearchQuery: string = '';
  localTime: string = '';
  convertedTime: string = '';

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
    this.filteredTimeZones = this.timeZones.filter((tz) =>
      tz.toLowerCase().includes(query)
    );
  }
}
