import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../services/draft.service';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { CopySVG } from '../../../images/svg-components/copy.component';
import { CheckSVG } from '../../../images/svg-components/score.component copy';
import { DraftOverviewPath } from '../../draft-overview/draft-overview-routing.module';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(advancedFormat);

@Component({
  selector: 'opponent-schedule',
  standalone: true,
  templateUrl: './opponent-schedule.component.html',
  imports: [CommonModule, RouterModule, FormsModule, CopySVG, CheckSVG],
})
export class OpponentSchedule implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private draftService = inject(DraftService);

  teamId: string = '';
  matchupId: string = '';
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
  get epochTime() {
    return this.timeData.dateTime.format('X');
  }
  copied: boolean = false;
  readonly draftPath = DraftOverviewPath;

  ngOnInit() {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamid') || '';
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = JSON.parse(params['matchup']);
        this.draftService
          .getGameTime(this.matchupId, this.teamId)
          .subscribe((data) => {
            this.timeData = {
              dateTime: dayjs(data.gameTime),
              email: data.reminder >= 0,
              emailTime: 2,
            };
            const currentDateString =
              this.timeData.dateTime.format('YYYY-MM-DD');
            const currentTimeString = this.timeData.dateTime.format('HH:mm');
            this.selectedDate = currentDateString;
            this.selectedTime = currentTimeString;
            this.opponentTimeZone = this.localTimeZone;
            this.updateTimes();
          });
      }
    });
  }

  updateTimes(source: 'local' | 'converted' = 'local') {
    if (source === 'local') {
      this.timeData.dateTime = dayjs.tz(
        `${this.selectedDate}T${this.selectedTime}`,
        this.localTimeZone,
      );
      const convertedDateTime = this.timeData.dateTime
        .clone()
        .tz(this.opponentTimeZone);
      this.convertedTime = convertedDateTime.format('HH:mm');
      this.convertedDate = convertedDateTime.format('YYYY-MM-DD');
    } else if (source === 'converted') {
      const convertedDateTime = dayjs.tz(
        `${this.convertedDate}T${this.convertedTime}`,
        this.opponentTimeZone,
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
        tz.name.toLowerCase().includes(query),
    );
  }

  copyTimestamp() {
    if (this.copied) return;
    navigator.clipboard
      .writeText(`<t:${this.epochTime}:f>`)
      .then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1000);
      })
      .catch((error) => {
        console.error('Failed to copy URL to clipboard: ', error);
      });
  }

  submit() {
    this.draftService
      .scheduleMatchup(this.matchupId, this.teamId, this.timeData)
      .subscribe({
        next: (response) => {
          console.log('Success!', response);
          this.router.navigate([`['/', draftPath]/${this.teamId}`]);
        },
        error: (error) => {
          console.error('Error!', error);
        },
      });
  }
}
