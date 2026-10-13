import type { TktEvent } from "@/mocks/types";

/** RFC 5545 UTC stamp: 20261009T113000Z */
function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** A single-event calendar file. Times are UTC, so every calendar app shows them in local time. */
export function eventIcs(e: TktEvent, url?: string): string {
  const location = e.format === "online" ? "Online" : e.venue ? `${e.venue.name}, ${e.venue.address}` : e.city;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tickets//Mock//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@tickets.mock`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${escape(e.title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(e.description[0] ?? "")}`,
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** Browser download of the .ics file. */
export function downloadIcs(e: TktEvent): void {
  const url = `${window.location.origin}/e/${e.slug}`;
  const blob = new Blob([eventIcs(e, url)], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${e.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
