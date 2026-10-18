export type Reading = string | number | null | undefined
export interface ReceiptMeasurement {
  tankNumber?: string
  initialSonde?: Reading
  finalSonde?: Reading
  initialLetva?: Reading
  finalLetva?: Reading
  initialLetva15?: Reading
  finalLetva15?: Reading
  initialSonde15?: Reading
  finalSonde15?: Reading
  initialLiters15Sonde?: Reading
  finalLiters15Sonde?: Reading
  initialLiters15Letva?: Reading
  finalLiters15Letva?: Reading
}

export function readQuantity(value: Reading): number | null {
  if (value == null || String(value).trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function sondeReading(m: ReceiptMeasurement, stage: 'initial' | 'final'): number | null {
  return readQuantity(m[`${stage}Sonde`]) ?? readQuantity(m[`${stage}Sonde15`]) ?? readQuantity(m[`${stage}Liters15Sonde`])
}

export function letvaReading(m: ReceiptMeasurement, stage: 'initial' | 'final'): number | null {
  return readQuantity(m[`${stage}Letva15`]) ?? readQuantity(m[`${stage}Liters15Letva`]) ?? readQuantity(m[`${stage}Letva`])
}

export function completePair(initial: Reading, final: Reading): [number, number] | null {
  const start = readQuantity(initial)
  const end = readQuantity(final)
  return start !== null && end !== null ? [start, end] : null
}

export function sondePair(m: ReceiptMeasurement): [number, number] | null {
  return completePair(m.initialSonde, m.finalSonde)
    ?? completePair(m.initialSonde15, m.finalSonde15)
    ?? completePair(m.initialLiters15Sonde, m.finalLiters15Sonde)
}

export function letvaPair(m: ReceiptMeasurement): [number, number] | null {
  return completePair(m.initialLetva15, m.finalLetva15)
    ?? completePair(m.initialLiters15Letva, m.finalLiters15Letva)
    ?? completePair(m.initialLetva, m.finalLetva)
}

export function receiptTotals(measurements: ReceiptMeasurement[]) {
  let sonde = 0
  let letva = 0
  let discharged = 0
  for (const m of measurements) {
    const s = sondePair(m)
    const l = letvaPair(m)
    if (s) sonde += s[1] - s[0]
    if (l) letva += l[1] - l[0]
    // Select a complete pair, never combine readings from different sources.
    const primary = l ?? s
    if (primary) discharged += primary[1] - primary[0]
  }
  return { sonde, letva, discharged }
}
