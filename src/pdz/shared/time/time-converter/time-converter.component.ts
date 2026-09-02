import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimezoneSelectComponent } from '@pdz/shared/dropdowns/timezone-select/timezone-select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SliderComponent } from '@pdz/shared/inputs/slider/slider.component';
import dayjs, { Dayjs } from 'dayjs';
import { DiscordTimestampComponent } from '../discord-timestamp/discord-timestamp.component';
import { localTimeZone, TimeZone } from '../timezone';

export type ConverterSide = 'local' | 'opponent';

const SLIDER_STEP_MINUTES = 15;

@Component({
  selector: 'pdz-time-converter',
  imports: [
    FormsModule,
    IconComponent,
    SliderComponent,
    TimezoneSelectComponent,
    DiscordTimestampComponent,
    FieldComponent,
    InputDirective,
  ],
  templateUrl: './time-converter.component.html',
  styleUrl: './time-converter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeConverterComponent implements OnInit {
  readonly value = model<string | null>(null);
  readonly localZone = model<TimeZone>(localTimeZone());
  readonly opponentZone = model<TimeZone>(localTimeZone());

  readonly localLabel = input('You');
  readonly opponentLabel = input('Opponent');
  readonly showSummary = input(true);
  readonly showStamp = input(true);

  protected readonly sliderMax = 24 * 60 - SLIDER_STEP_MINUTES;
  protected readonly sliderStep = SLIDER_STEP_MINUTES;

  private readonly instant = signal<Dayjs>(nextQuarterHour());

  readonly isoValue = computed(() => this.instant().toISOString());

  ngOnInit(): void {
    if (!this.value()) this.value.set(this.instant().toISOString());
  }

  constructor() {
    effect(() => {
      const incoming = this.value();
      if (!incoming) return;
      const ms = new Date(incoming).getTime();
      if (Number.isNaN(ms)) return;
      untracked(() => {
        if (this.instant().valueOf() !== ms) this.instant.set(dayjs(ms));
      });
    });
  }

  protected readonly localDate = computed(() => this.dateIn('local'));
  protected readonly localTime = computed(() => this.timeIn('local'));
  protected readonly opponentDate = computed(() => this.dateIn('opponent'));
  protected readonly opponentTime = computed(() => this.timeIn('opponent'));

  protected readonly localMinutes = computed(() =>
    toMinutes(this.localTime()),
  );
  protected readonly opponentMinutes = computed(() =>
    toMinutes(this.opponentTime()),
  );

  protected readonly localDisplay = computed(() => this.displayIn('local'));
  protected readonly opponentDisplay = computed(() =>
    this.displayIn('opponent'),
  );

  private zoneFor(side: ConverterSide): TimeZone {
    return side === 'local' ? this.localZone() : this.opponentZone();
  }

  private dateIn(side: ConverterSide): string {
    return this.instant().tz(this.zoneFor(side).name).format('YYYY-MM-DD');
  }

  private timeIn(side: ConverterSide): string {
    return this.instant().tz(this.zoneFor(side).name).format('HH:mm');
  }

  private displayIn(side: ConverterSide): string {
    return this.instant()
      .tz(this.zoneFor(side).name)
      .format('dddd, MMMM D, YYYY h:mm A');
  }

  setDate(side: ConverterSide, date: string): void {
    if (!date) return;
    this.commit(side, date, this.timeIn(side));
  }

  setTime(side: ConverterSide, time: string): void {
    if (!time) return;
    this.commit(side, this.dateIn(side), time);
  }

  setMinutes(side: ConverterSide, minutes: number): void {
    this.commit(side, this.dateIn(side), fromMinutes(minutes));
  }

  setZone(side: ConverterSide, zone: TimeZone | undefined): void {
    if (!zone) return;
    if (side === 'local') this.localZone.set(zone);
    else this.opponentZone.set(zone);
  }

  private commit(side: ConverterSide, date: string, time: string): void {
    const next = dayjs.tz(`${date}T${time}:00`, this.zoneFor(side).name);
    if (!next.isValid()) return;
    this.instant.set(next);
    this.value.set(next.toISOString());
  }
}

function nextQuarterHour(): Dayjs {
  const now = dayjs().second(0).millisecond(0);
  const remainder = now.minute() % SLIDER_STEP_MINUTES;
  return remainder === 0
    ? now
    : now.add(SLIDER_STEP_MINUTES - remainder, 'minute');
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
