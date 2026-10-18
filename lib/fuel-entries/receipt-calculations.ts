import { calculateDeliveryNoteQuantity } from '@/lib/utils/receipt-quantity'
import { receiptTotals, type ReceiptMeasurement } from './measurements'

export function receiptQuantities(measurements: ReceiptMeasurement[], announced: number | null, sold: number | null) {
  const dischargedQuantity = receiptTotals(measurements).discharged
  const deliveryNoteQuantity = calculateDeliveryNoteQuantity(measurements, sold)
  return {
    announcedQuantity: announced,
    meterReading: sold,
    dischargedQuantity,
    differenceQuantity: (announced ?? 0) - dischargedQuantity,
    deliveryNoteQuantity,
    finalDifference: deliveryNoteQuantity === null ? null : deliveryNoteQuantity - dischargedQuantity,
  }
}
