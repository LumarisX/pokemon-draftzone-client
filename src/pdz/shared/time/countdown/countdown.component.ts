import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  input,
  signal,
} from '@angular/core';
import { formatExactTime } from '../timezone';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type CountdownState = 'upcoming' | 'imminent' | 'live' | 'past';

@Component({
  selector: 'pdz-countdown',
  template: `{{ label() }}`,
  styleUrl: './countdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-countdown',
    '[attr.data-state]': 'state()',
    '[attr.datetime]': 'isoTarget()',
    '[attr.title]': 'showTitle() ? exact() : null',
  },
})
export class CountdownComponent implements OnDestroy {
  readonly target = input<string | Date | null>(null);
  readonly prefix = input(true);
  readonly liveWindowMinutes = input(90);
  readonly showTitle = input(true);

  private readonly now = signal(Date.now());
  private readonly timer = setInterval(() => this.now.set(Date.now()), 30_000);

  private readonly targetMs = computed(() => {
    const raw = this.target();
    if (!raw) return null;
    const ms = new Date(raw).getTime();
    return Number.isNaN(ms) ? null : ms;
  });

  readonly isoTarget = computed(() => {
    const ms = this.targetMs();
    return ms === null ? null : new Date(ms).toISOString();
  });

  readonly state = computed<CountdownState>(() => {
    const ms = this.targetMs();
    if (ms === null) return 'past';
    const diff = ms - this.now();
    if (diff > HOUR) return 'upcoming';
    if (diff > 0) return 'imminent';
    if (diff > -this.liveWindowMinutes() * MINUTE) return 'live';
    return 'past';
  });

  readonly exact = computed(() => {
    const ms = this.targetMs();
    return ms === null ? null : formatExactTime(ms);
  });

  readonly label = computed(() => {
    const ms = this.targetMs();
    if (ms === null) return '';

    const diff = ms - this.now();
    if (this.state() === 'live') return 'Starting now';

    const span = formatSpan(Math.abs(diff));
    if (diff <= 0) return this.prefix() ? `${span} ago` : span;
    return this.prefix() ? `in ${span}` : span;
  });

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}

function formatSpan(ms: number): string {
  if (ms >= DAY) {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / HOUR);
    return hours ? `${days}d ${hours}h` : `${days}d`;
  }
  if (ms >= HOUR) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const minutes = Math.floor(ms / MINUTE);
  return minutes > 0 ? `${minutes}m` : 'less than a minute';
}
