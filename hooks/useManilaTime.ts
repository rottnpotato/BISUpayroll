"use client"

import { useMemo } from 'react'
import {
  MANILA_TZ_ID,
  toManilaDateKey,
  fromManilaPartsToUTC,
  manilaStartOfDayUTC,
  manilaEndOfDayUTC,
  getManilaHours,
  getManilaMinutes,
  isLateInManila,
  formatManila,
  formatManilaISO,
  parseManilaLocal,
} from '@/lib/timezone'

export function useManilaTime() {
  return useMemo(() => ({
    tz: MANILA_TZ_ID,
    toManilaDateKey,
    fromManilaPartsToUTC,
    manilaStartOfDayUTC,
    manilaEndOfDayUTC,
    getManilaHours,
    getManilaMinutes,
    isLateInManila,
    format: (
      input: Date | string | number,
      opts?: Intl.DateTimeFormatOptions
    ) => formatManila(input, opts),
    formatISO: formatManilaISO,
    parseLocal: parseManilaLocal,
  }), [])
}

export default useManilaTime
