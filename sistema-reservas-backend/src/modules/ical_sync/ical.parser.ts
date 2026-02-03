export interface ParsedIcalEvent {
  uid: string;
  start: Date;
  end: Date;
  raw: string | null;
}

const UID_REGEX = /^UID(?:;[^:]*)?:(.+)$/i;
const DTSTART_REGEX = /^DTSTART(?:;[^:]*)?:(.+)$/i;
const DTEND_REGEX = /^DTEND(?:;[^:]*)?:(.+)$/i;

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
    const lines = veventRaw.split(/\r?\n/).map((line) => line.trim());

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
        const parsed = parseIcalDate(startMatch[1].trim());
        if (parsed) {
          dtstart = parsed;
        }
        return;
      }

      const endMatch = DTEND_REGEX.exec(line);
      if (!dtend && endMatch) {
        const parsed = parseIcalDate(endMatch[1].trim());
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

function parseIcalDate(value: string): Date | null {
  const dateTimeMatch =
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/i.exec(value);
  if (dateTimeMatch) {
    const [, year, month, day, hour, minute, second, zFlag] = dateTimeMatch;
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${zFlag ? 'Z' : ''}`;
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateMatch = /^(\d{4})(\d{2})(\d{2})$/i.exec(value);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const iso = `${year}-${month}-${day}T00:00:00Z`;
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
