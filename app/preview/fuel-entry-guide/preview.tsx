'use client'
import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { FuelEntryGuideLauncher, FuelEntryGuideProvider, useFuelEntryGuide } from '@/components/onboarding/FuelEntryGuide'
import CreateFuelEntryModal from '@/components/fuel-entries/CreateFuelEntryModal'

const stations = [{ id: 'demo', name: 'Primjer poslovnice', code: 'DEMO', address: 'Primjer za prikaz vodiča', isActive: true }]
function PreviewContent() {
  const guide = useFuelEntryGuide()
  return <>
    <FuelEntryGuideLauncher />
    {guide.active && guide.target !== 'print' && <CreateFuelEntryModal guidePreview warehouses={[]} stations={stations} onClose={guide.dismiss} onSuccess={() => {}} />}
  </>
}
export default function GuidePreview() {
  const [role, setRole] = useState('PUMPA')
  return <main className="min-h-screen bg-dark-50 p-6 md:p-12">
    <h1 className="text-2xl font-bold mb-3">Pregled vodiča za korisnike</h1>
    <p className="text-dark-600 mb-6">Lokalni prikaz s primjerom poslovnice. Ne pristupa bazi i ne sprema završetak vodiča.</p>
    <div className="flex gap-3 mb-8">{['PUMPA', 'OPERATOR'].map(value => <button key={value} onClick={() => setRole(value)} aria-pressed={role === value} className={`rounded-xl px-5 py-3 ${value === role ? 'bg-dark-900 text-white' : 'bg-white border border-dark-200'}`}>{value === 'PUMPA' ? 'Korisnik pumpe' : 'Operator terminala'}</button>)}</div>
    <SessionProvider key={role} session={{ user: { id: 'preview', name: 'Pregled', role, stations, warehouses: [] }, expires: '2099-01-01T00:00:00Z' }} refetchOnWindowFocus={false}>
      <FuelEntryGuideProvider preview><PreviewContent /></FuelEntryGuideProvider>
    </SessionProvider>
  </main>
}
