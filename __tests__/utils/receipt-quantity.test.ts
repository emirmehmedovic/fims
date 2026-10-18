import { calculateDeliveryNoteQuantity } from '@/lib/utils/receipt-quantity'

describe('Otpremnica quantity', () => {
  it('uses sonde readings and adds sales once', () => {
    expect(calculateDeliveryNoteQuantity([
      { initialSonde: '1000', finalSonde: '4000', initialLetva: '900', finalLetva: '3800' },
      { initialSonde: '500', finalSonde: '1500' },
    ], '250')).toBe(4250)
  })
  it('falls back to letva when sonde readings are absent', () => {
    expect(calculateDeliveryNoteQuantity([{ initialSonde: '', finalSonde: '', initialLetva: '100', finalLetva: '900' }], '50')).toBe(850)
  })
  it('treats zero as a real sonde reading', () => {
    expect(calculateDeliveryNoteQuantity([{ initialSonde: '0', finalSonde: '0', initialLetva: '100', finalLetva: '900' }], '50')).toBe(50)
  })
  it('supports different measurement sources across tanks', () => {
    expect(calculateDeliveryNoteQuantity([{ initialSonde: 0, finalSonde: 200 }, { initialLetva: 100, finalLetva: 400 }], null)).toBe(500)
  })
  it('leaves the result empty until readings are complete', () => {
    expect(calculateDeliveryNoteQuantity([], '10')).toBeNull()
    expect(calculateDeliveryNoteQuantity([{ initialSonde: '100' }], '10')).toBeNull()
    expect(calculateDeliveryNoteQuantity([{ initialLetva: '100' }], '10')).toBeNull()
  })
})
