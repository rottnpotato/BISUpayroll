// Manila (GMT+8) timezone helpers to keep all date math consistent across server and client.
// Contract:
// - All Dates passed in are assumed to be real UTC timestamps (as JS Date stores time in UTC).
// - Formatting and comparisons (like late thresholds) should be done in Asia/Manila local time.
// - When creating a timestamp from Manila-local components, we return a JS Date that represents the
//   equivalent instant in UTC.

const MANILA_TZ = 'Asia/Manila'
const MANILA_OFFSET_HOURS = 8 // Philippines has no DST, static +8
const HOUR_MS = 60 * 60 * 1000

/**
 * Convert a UTC instant to its Manila-local Y-M-D key (yyyy-MM-dd).
 */
export function toManilaDateKey(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return ''
  // Shift to Manila by adding offset, then read UTC parts
  const manila = new Date(d.getTime() + MANILA_OFFSET_HOURS * HOUR_MS)
  const y = manila.getUTCFullYear()
  const m = String(manila.getUTCMonth() + 1).padStart(2, '0')
  const day = String(manila.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Create a UTC Date that corresponds to a Manila-local time.
 * Example: (2025, 10, 13, 9, 0) -> a Date that when formatted in Manila shows 2025-10-13 09:00.
 */
export function fromManilaPartsToUTC(
  year: number,
  month: number, // 1-12
  day: number,   // 1-31
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  // Build UTC midnight then subtract offset to land on the correct instant
  // Manila 00:00 corresponds to UTC - 8 hours
  const utc = new Date(Date.UTC(year, month - 1, day, hours - MANILA_OFFSET_HOURS, minutes, seconds, ms))
  return utc
}

/**
 * Given any instant, return the UTC Date for Manila's start-of-day (00:00) at that date.
 */
export function manilaStartOfDayUTC(input: Date | string | number): Date {
  const d = input instanceof Date ? input : new Date(input)
  const key = toManilaDateKey(d)
  if (!key) return new Date(NaN)
  const [y, m, dd] = key.split('-').map(Number)
  return fromManilaPartsToUTC(y, m, dd, 0, 0, 0, 0)
}

/**
 * Given any instant, return the UTC Date for Manila's end-of-day (23:59:59.999) at that date.
 */
export function manilaEndOfDayUTC(input: Date | string | number): Date {
  const start = manilaStartOfDayUTC(input)
  if (isNaN(start.getTime())) return start
  return new Date(start.getTime() + 24 * HOUR_MS - 1)
}

/**
 * Hours (0-23) in Manila for the given UTC instant.
 */
export function getManilaHours(input: Date | string | number): number {
  const d = input instanceof Date ? input : new Date(input)
  const manila = new Date(d.getTime() + MANILA_OFFSET_HOURS * HOUR_MS)
  return manila.getUTCHours()
}

/** Minutes (0-59) in Manila for the given UTC instant. */
export function getManilaMinutes(input: Date | string | number): number {
  const d = input instanceof Date ? input : new Date(input)
  const manila = new Date(d.getTime() + MANILA_OFFSET_HOURS * HOUR_MS)
  return manila.getUTCMinutes()
}

/** True if input is later than 08:15 AM Manila by default. */
export function isLateInManila(input: Date | string | number, startHour = 8, graceMinutes = 15): boolean {
  const h = getManilaHours(input)
  const m = getManilaMinutes(input)
  return h > startHour || (h === startHour && m > graceMinutes)
}

/**
 * Format a UTC instant as Manila time using Intl.DateTimeFormat.
 */
export function formatManila(input: Date | string | number, opts?: Intl.DateTimeFormatOptions): string {
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return ''
  const formatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA_TZ,
    ...opts,
  })
  return formatter.format(d)
}

/**
 * Format an ISO-like string representing Manila-local date/time for storage/transmission.
 * Example: returns 'yyyy-MM-ddTHH:mm:ss.SSS+08:00'.
 */
export function formatManilaISO(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return ''
  // Build parts in Manila
  const manila = new Date(d.getTime() + MANILA_OFFSET_HOURS * HOUR_MS)
  const y = manila.getUTCFullYear()
  const m = String(manila.getUTCMonth() + 1).padStart(2, '0')
  const day = String(manila.getUTCDate()).padStart(2, '0')
  const hh = String(manila.getUTCHours()).padStart(2, '0')
  const mm = String(manila.getUTCMinutes()).padStart(2, '0')
  const ss = String(manila.getUTCSeconds()).padStart(2, '0')
  const ms = String(manila.getUTCMilliseconds()).padStart(3, '0')
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}.${ms}+08:00`
}

/**
 * Parse a 'yyyy-MM-dd' or 'yyyy-MM-ddTHH:mm' string as a Manila-local time and return its UTC Date.
 */
export function parseManilaLocal(input: string): Date {
  const [datePart, timePart] = input.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  let hh = 0, mm = 0
  if (timePart) {
    const [hStr, mStr] = timePart.split(':')
    hh = Number(hStr)
    mm = Number(mStr)
  }
  return fromManilaPartsToUTC(y, m, d, hh, mm)
}

export const MANILA_TZ_ID = MANILA_TZ
