import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { FuelEntryGuideProvider, FuelEntryGuideLauncher } from '@/components/onboarding/FuelEntryGuide'
import { FUEL_ENTRY_GUIDE_VERSION, fuelEntryGuideSteps } from '@/lib/onboarding/fuel-entry-guide'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard/fuel-entries', useRouter: () => ({ push: jest.fn() }) }))
const response = (data: unknown, ok = true) => ({ ok, json: async () => ({ success: ok, data }) })
function session(role = 'OPERATOR') {
  jest.mocked(useSession).mockReturnValue({ data: { user: { id: 'operator', role }, expires: '' }, status: 'authenticated', update: jest.fn() } as ReturnType<typeof useSession>)
}
beforeEach(() => { session(); global.fetch = jest.fn().mockResolvedValue(response({ completed: false })) })
afterEach(() => jest.clearAllMocks())
function mount() { return render(<FuelEntryGuideProvider><FuelEntryGuideLauncher /><button>Rad u aplikaciji</button></FuelEntryGuideProvider>) }

it('finishes only on the final step and saves the current version', async () => {
  mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Pokaži mi' }))
  expect(screen.getByRole('heading', { name: 'Uvezite prijavu po tipu goriva' })).toBeInTheDocument()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Dalje' }))
  fireEvent.click(screen.getByRole('button', { name: 'Završi vodič' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(global.fetch).toHaveBeenLastCalledWith('/api/account/fuel-entry-guide', expect.objectContaining({ method: 'POST', body: JSON.stringify({ version: FUEL_ENTRY_GUIDE_VERSION }) }))
})
it('does not show completed guides automatically but allows replay', async () => {
  jest.mocked(fetch).mockResolvedValue(response({ completed: true }) as Response)
  mount()
  await waitFor(() => expect(fetch).toHaveBeenCalled())
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Pokreni vodič' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
it('defers without writing completion and restores the application', async () => {
  mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Kasnije' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(document.getElementById('guided-app-content')).not.toHaveAttribute('inert')
})
it('retains the final step and offers retry if saving fails', async () => {
  mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Pokaži mi' }))
  fireEvent.click(screen.getByRole('button', { name: 'Dalje' }))
  jest.mocked(fetch).mockRejectedValueOnce(new Error('offline'))
  fireEvent.click(screen.getByRole('button', { name: 'Završi vodič' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Završetak nije spremljen')
  expect(screen.getByRole('button', { name: 'Završi vodič' })).toBeEnabled()
})
it('uses the PUMPA workflow and never offers import by fuel type', async () => {
  session('PUMPA'); mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Pokaži mi' }))
  expect(screen.getByRole('heading', { name: 'Vaša poslovnica je već odabrana' })).toBeInTheDocument()
  expect(fuelEntryGuideSteps('PUMPA').map(s => s.target)).toEqual(['station', 'import', 'measurements', 'quantities', 'checklist', 'print'])
  expect(fuelEntryGuideSteps('PUMPA')[1].description).not.toContain('tipa goriva')
})
it('does not fetch or auto-show the guide for administrators', () => {
  session('ADMIN'); mount()
  expect(fetch).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
