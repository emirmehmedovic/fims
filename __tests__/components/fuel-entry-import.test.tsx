import toast from 'react-hot-toast'
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import CreateFuelEntryModal from '@/components/fuel-entries/CreateFuelEntryModal'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }))

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: true, data: [] }) })
})
afterEach(() => jest.restoreAllMocks())

it.each(['PUMPA', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'])('shows the appropriate import control for %s', async (role) => {
  jest.mocked(useSession).mockReturnValue({ data: { user: { id: 'test', role, warehouses: [], stations: [] }, expires: '' }, status: 'authenticated', update: jest.fn() } as ReturnType<typeof useSession>)
  render(<CreateFuelEntryModal warehouses={[]} stations={[]} onClose={jest.fn()} onSuccess={jest.fn()} />)
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(screen.getByRole('button', { name: 'Uvezi s prošle prijave' })).toBeInTheDocument()
  if (role === 'PUMPA') {
    expect(screen.queryByTitle('Uvezi po tipu goriva')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Uvezi s prošle prijave' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/fuel-entries/last'))
  } else {
    expect(screen.getByTitle('Uvezi po tipu goriva')).toBeInTheDocument()
  }
})


it('shows named missing fields in Bosnian before submitting an empty form', async () => {
  jest.mocked(useSession).mockReturnValue({ data: { user: { id: 'test', role: 'ADMIN', warehouses: [], stations: [] }, expires: '' }, status: 'authenticated', update: jest.fn() } as ReturnType<typeof useSession>)
  const { container } = render(<CreateFuelEntryModal warehouses={[]} stations={[]} onClose={jest.fn()} onSuccess={jest.fn()} />)
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  fireEvent.submit(container.querySelector('form')!)
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Skladište, Naziv proizvoda, Količina (litara)'), expect.any(Object))
  expect(global.fetch).not.toHaveBeenCalledWith('/api/fuel-entries', expect.objectContaining({ method: 'POST' }))
})
