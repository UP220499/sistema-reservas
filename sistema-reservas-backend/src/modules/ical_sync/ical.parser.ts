export interface ParsedIcalEvent {
  uid: string;
  start: Date;
  end: Date;
  raw: string | null;
}

const UID_REGEX = /^UID(?:;[^:]*)?:(.+)$/i;
const DTSTART_REGEX = /^DTSTART(?:;[^:]*)?:(.+)$/i;
const DTEND_REGEX = /^DTEND(?:;[^:]*)?:(.+)$/i;

interface IcalProperty {
  value: string;
  params: Record<string, string>;
}

export function parseIcalEvents(icsContent: string): ParsedIcalEvent[] {
  const events: ParsedIcalEvent[] = [];
  const segments = icsContent.split('BEGIN:VEVENT');

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    const endIndex = segment.indexOf('END:VEVENT');

    if (endIndex === -1) {
      continue;
    }

    const veventRaw = segment.slice(0, endIndex).trim();
    const lines = unfoldIcalLines(veventRaw);

    let uid: string | undefined;
    let dtstart: Date | undefined;
    let dtend: Date | undefined;

    lines.forEach((line) => {
      const uidMatch = UID_REGEX.exec(line);
      if (!uid && uidMatch) {
        uid = uidMatch[1].trim();
        return;
      }

      const startMatch = DTSTART_REGEX.exec(line);
      if (!dtstart && startMatch) {
        const property = parseProperty(startMatch[0]);
        const parsed = property ? parseIcalDate(property, false) : null;
        if (parsed) {
          dtstart = parsed;
        }
        return;
      }

      const endMatch = DTEND_REGEX.exec(line);
      if (!dtend && endMatch) {
        const property = parseProperty(endMatch[0]);
        const parsed = property ? parseIcalDate(property, true) : null;
        if (parsed) {
          dtend = parsed;
        }
      }
    });

    if (!uid || !dtstart || !dtend) {
      continue;
    }

    if (dtend <= dtstart) {
      continue;
    }

    events.push({
      uid,
      start: dtstart,
      end: dtend,
      raw: veventRaw.length > 0 ? veventRaw : null,
    });
  }

  return events;
}

function unfoldIcalLines(raw: string): string[] {
  const lines = raw.split(/\r?\n/);
  const unfolded: string[] = [];

  for (const line of lines) {
    if (/^[ \t]/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
      continue;
    }

    unfolded.push(line.trim());
  }

  return unfolded;
}

function parseProperty(line: string): IcalProperty | null {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex <= 0) {
    return null;
  }

  const meta = line.slice(0, separatorIndex);
  const value = line.slice(separatorIndex + 1).trim();

  if (!value) {
    return null;
  }

  const [, ...paramsList] = meta.split(';');
  const params: Record<string, string> = {};

  for (const param of paramsList) {
    const [rawKey, rawValue] = param.split('=');
    if (!rawKey || !rawValue) {
      continue;
    }

    params[rawKey.toUpperCase()] = rawValue.trim();
  }

  return { value, params };
}

function parseIcalDate(property: IcalProperty, isEnd: boolean = false): Date | null {
  const { value, params } = property;
  const valueType = params.VALUE?.toUpperCase();

  if (valueType === 'DATE') {
    return parseDateValue(value, isEnd);
  }

  const dateTime = parseDateTimeValue(value);
  if (dateTime) {
    return dateTime;
  }

  if (/^\d{8}$/.test(value)) {
    return parseDateValue(value, isEnd);
  }

  return null;
}

/** IANA timezone for MX local-calendar calculations. */
const MX_TZ = 'America/Mexico_City';

function getMxOffsetMs(at: Date): number {
  const epochOf = (tz: string): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(at);
    const g = (t: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((p) => p.type === t)?.value ?? 0);
    return Date.UTC(
      g('year'),
      g('month') - 1,
      g('day'),
      g('hour'),
      g('minute'),
      g('second'),
    );
  };
  return epochOf(MX_TZ) - epochOf('UTC');
}

function parseDateValue(value: string, isEnd: boolean): Date | null {
  const dateMatch = /^(\d{4})(\d{2})(\d{2})$/i.exec(value);
  if (!dateMatch) {
    return null;
  }

  const [, year, month, day] = dateMatch;
  const probe = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
  const offsetMs = getMxOffsetMs(probe);

  const hour = isEnd ? 12 : 15;
  const mxAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), hour, 0, 0);
  const parsed = new Date(mxAsUtc - offsetMs);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateTimeValue(value: string): Date | null {
  const dateTimeMatch =
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/i.exec(value);

  if (!dateTimeMatch) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = dateTimeMatch;

  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      0,
    ),
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
