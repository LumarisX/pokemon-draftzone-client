import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import moment, { Moment } from 'moment-timezone';

@Component({
  selector: 'opponent-schedule',
  standalone: true,
  templateUrl: './opponent-schedule.component.html',
  imports: [CommonModule, RouterModule, FormsModule],
})
export class OpponentSchedule implements OnInit {
  teamId: string = '';
  selectedDate: string = '';
  selectedTime: string = '';
  opponentTimeZone: string = '';
  emailReminder: boolean = true;
  emailTime: number = 1;
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
  convertedTime: string = '';
  convertedDate: string = '';
  timeDifference: string = '';
  localDateTime: Moment = moment();

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamid') || '';
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().slice(0, 10);
    const currentTimeString = currentDate.toTimeString().slice(0, 5);
    this.selectedDate = currentDateString;
    this.selectedTime = currentTimeString;
    this.opponentTimeZone = this.localTimeZone;
    this.updateTimes();
  }

  updateTimes(source: 'local' | 'converted' = 'local') {
    if (source === 'local') {
      this.localDateTime = moment.tz(
        `${this.selectedDate}T${this.selectedTime}`,
        this.localTimeZone
      );
      const convertedDateTime = this.localDateTime
        .clone()
        .tz(this.opponentTimeZone);
      this.convertedTime = convertedDateTime.format('HH:mm');
      this.convertedDate = convertedDateTime.format('YYYY-MM-DD');
    } else if (source === 'converted') {
      const convertedDateTime = moment.tz(
        `${this.convertedDate}T${this.convertedTime}`,
        this.opponentTimeZone
      );
      this.localDateTime = convertedDateTime.clone().tz(this.localTimeZone);
      this.selectedTime = this.localDateTime.format('HH:mm');
      this.selectedDate = this.localDateTime.format('YYYY-MM-DD');
    }
    this.calculateTimeDifference(this.localDateTime);
  }

  calculateTimeDifference(localDateTime: Moment) {
    if (this.localDateTime.isValid()) {
      const currentTime = moment();
      const duration = moment.duration(localDateTime.diff(currentTime));
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
