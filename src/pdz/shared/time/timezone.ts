import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

export type TimeZone = {
  short?: string;
  name: string;
  utc: string;
  offset: number;
};

export function describeZone(name: string): TimeZone {
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

let zones: TimeZone[] | null = null;
let abbreviated: TimeZone[] | null = null;

export function timeZones(): TimeZone[] {
  if (!zones) {
    zones = Intl.supportedValuesOf('timeZone')
      .map(describeZone)
      .sort((a, b) => a.offset - b.offset);
  }
  return zones;
}

export function abbreviatedTimeZones(): TimeZone[] {
  if (!abbreviated) {
    abbreviated = timeZones().reduce((acc, tz) => {
      if (tz.short && !acc.some((existing) => existing.short === tz.short)) {
        acc.push(tz);
      }
      return acc;
    }, [] as TimeZone[]);
  }
  return abbreviated;
}

export function localTimeZone(): TimeZone {
  return describeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

export function findTimeZone(name: string | null | undefined): TimeZone | null {
  if (!name) return null;
  const known = timeZones().find((tz) => tz.name === name);
  if (known) return known;
  try {
    return describeZone(name);
  } catch {
    return null;
  }
}

export function formatExactTime(value: Date | string | number): string {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function discordTimestamp(
  value: Date | string | number,
  style: 'f' | 'F' | 'R' | 't' | 'T' | 'd' | 'D' = 'f',
): string {
  return `<t:${dayjs(value).unix()}:${style}>`;
}
