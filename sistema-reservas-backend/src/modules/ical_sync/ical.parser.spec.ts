import { parseIcalEvents } from './ical.parser';

describe('parseIcalEvents', () => {
  it('parses all-day Airbnb events as [inicio, fin) without timezone drift', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:airbnb-123
DTSTART;VALUE=DATE:20260310
DTEND;VALUE=DATE:20260312
END:VEVENT
END:VCALENDAR`;

    const events = parseIcalEvents(ics);

    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe('airbnb-123');
    expect(events[0].start.toISOString()).toBe('2026-03-10T00:00:00.000Z');
    expect(events[0].end.toISOString()).toBe('2026-03-12T00:00:00.000Z');
    expect(events[0].end.getTime()).toBeGreaterThan(events[0].start.getTime());
  });

  it('parses date-time values without relying on server local timezone', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:airbnb-456
DTSTART:20260310T150000
DTEND:20260312T110000
END:VEVENT
END:VCALENDAR`;

    const events = parseIcalEvents(ics);

    expect(events).toHaveLength(1);
    expect(events[0].start.toISOString()).toBe('2026-03-10T15:00:00.000Z');
    expect(events[0].end.toISOString()).toBe('2026-03-12T11:00:00.000Z');
  });

  it('supports folded iCal lines', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:folded-1
DTSTART;VALUE=DATE:20260310
DTEND;VALUE=DATE:20260312
DESCRIPTION:Bloqueo de Airbnb con linea muy larga que se
 continua en otra linea
END:VEVENT
END:VCALENDAR`;

    const events = parseIcalEvents(ics);

    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe('folded-1');
  });
});
