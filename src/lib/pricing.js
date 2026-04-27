/**
 * Calcola il prezzo totale in base all'orario di arrivo e alla durata.
 * Tariffa giorno (06:00-22:00): £3/h
 * Tariffa sera  (22:00-06:00): £1/h
 */
export function calcPrice(arrivalISO, durationH) {
  const DAY_RATE   = 3  // £/h
  const NIGHT_RATE = 1  // £/h

  let total      = 0
  let cursor     = new Date(arrivalISO)
  const end      = new Date(cursor.getTime() + durationH * 3600 * 1000)
  let period     = 'giorno'
  let hasDay     = false
  let hasNight   = false

  while (cursor < end) {
    const h       = cursor.getHours()
    const isDay   = h >= 6 && h < 22
    const nextH   = new Date(cursor)
    nextH.setMinutes(0, 0, 0)
    nextH.setHours(isDay ? 22 : (h >= 22 ? 30 : 6))  // prossimo cambio tariffa
    if (nextH > end) nextH.setTime(end.getTime())

    const fracH = (nextH - cursor) / 3600000
    if (isDay) { total += fracH * DAY_RATE;   hasDay   = true }
    else        { total += fracH * NIGHT_RATE; hasNight = true }

    cursor = nextH
  }

  if (hasDay && hasNight) period = 'misto'
  else if (hasNight)      period = 'sera'
  else                    period = 'giorno'

  return { total: Math.round(total * 100) / 100, period }
}