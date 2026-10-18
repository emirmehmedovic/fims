import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import ReceiptCalculations from '@/components/fuel-entries/ReceiptCalculations'
import { emptyMeasurement } from '@/components/fuel-entries/TankMeasurementsForm'

it('locks Otpremnica and recalculates it after measurements and sales change', () => {
  const props = {
    measurements: [{ ...emptyMeasurement, initialSonde: '1000', finalSonde: '4000' }],
    meterReading: '200',
    announcedQuantity: '',
    onAnnouncedQuantityChange: jest.fn(),
    onMeterReadingChange: jest.fn(),
  }
  const { rerender } = render(<ReceiptCalculations {...props} />)
  const field = screen.getByRole('spinbutton', { name: 'Otpremnica (L)' })
  expect(field).toHaveAttribute('readonly')
  expect(field).toHaveValue(3200)
  expect(screen.getByText('Prodata količina u toku istakanja (L)')).toBeInTheDocument()

  rerender(<ReceiptCalculations {...props} meterReading="100" measurements={[
    { ...emptyMeasurement, initialLetva: '500', finalLetva: '1500' },
  ]} />)
  expect(field).toHaveValue(1100)
})
