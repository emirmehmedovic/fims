const SARAJEVO_TIME_ZONE = 'Europe/Sarajevo'

const getTimeZoneParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value
    }
  }

  return map
}

const getTimeZoneOffsetMinutes = (timeZone: string, date: Date) => {
  const parts = getTimeZoneParts(date, timeZone)
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )

  return (asUtc - date.getTime()) / 60000
}

const startOfDayInTimeZone = (dateString: string, timeZone: string) => {
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) {
    return new Date(dateString)
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, utcDate)
  return new Date(utcDate.getTime() - offsetMinutes * 60000)
}

const startOfNextDayInTimeZone = (dateString: string, timeZone: string) => {
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) {
    return new Date(dateString)
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0))
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, utcDate)
  return new Date(utcDate.getTime() - offsetMinutes * 60000)
}

export const formatDateSarajevo = (dateInput: string | Date) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = getTimeZoneParts(date, SARAJEVO_TIME_ZONE)
  return `${parts.day}.${parts.month}.${parts.year}`
}

export const formatDateTimeSarajevo = (dateInput: string | Date) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = getTimeZoneParts(date, SARAJEVO_TIME_ZONE)
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`
}

export const formatDateTimeSecondsSarajevo = (dateInput: string | Date) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = getTimeZoneParts(date, SARAJEVO_TIME_ZONE)
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`
}

export const formatDateInputValueSarajevo = (dateInput: string | Date) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = getTimeZoneParts(date, SARAJEVO_TIME_ZONE)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export const shiftDateInputValueSarajevo = (dateInput: string, days: number) => {
  const [year, month, day] = dateInput.split('-').map(Number)
  if (!year || !month || !day || Number.isNaN(days)) {
    return dateInput
  }

  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return formatDateInputValueSarajevo(shifted)
}

export const startOfDaySarajevo = (dateString: string) =>
  startOfDayInTimeZone(dateString, SARAJEVO_TIME_ZONE)

export const startOfNextDaySarajevo = (dateString: string) =>
  startOfNextDayInTimeZone(dateString, SARAJEVO_TIME_ZONE)

export { SARAJEVO_TIME_ZONE }
