'use client'

import { Database, Package, Globe, MapPin, Sparkles, Building2, Truck } from 'lucide-react'
import MasterDataManager from '@/components/master-data/MasterDataManager'

export default function MasterDataPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-[var(--shadow-soft-xl)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Master Podaci</h1>
              <p className="text-dark-300 text-sm">
                Upravljajte globalnim podacima koji su dostupni svim skladištima
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Package, title: 'Proizvodi', description: 'Nazivi goriva', color: 'from-blue-500 to-blue-600' },
          { icon: Globe, title: 'Zemlje', description: 'Zemlje porijekla', color: 'from-emerald-500 to-emerald-600' },
          { icon: MapPin, title: 'Lokacije', description: 'Lokacije preuzimanja', color: 'from-amber-500 to-amber-600' },
          { icon: Sparkles, title: 'Karakteristike', description: 'Karakteristike goriva', color: 'from-purple-500 to-purple-600' },
          { icon: Building2, title: 'Dobavljači', description: 'Dobavljači goriva', color: 'from-indigo-500 to-indigo-600' },
          { icon: Truck, title: 'Prevoznici', description: 'Transportne firme', color: 'from-rose-500 to-rose-600' },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl p-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-soft-xl)] transition-all border border-dark-100"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-dark-900 text-sm mb-0.5">{item.title}</h3>
            <p className="text-xs text-dark-500">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Master Data Manager */}
      <MasterDataManager />

      {/* Additional Info */}
      <div className="bg-dark-100 border border-dark-200 rounded-2xl p-6">
        <h3 className="font-semibold text-dark-900 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-dark-600" />
          Napomena
        </h3>
        <p className="text-dark-600 text-sm leading-relaxed">
          Master podaci su globalni i dostupni svim skladištima. Promjene koje napravite ovdje
          će se odmah odraziti u formama za unos goriva. Deaktivirane stavke neće biti vidljive
          u dropdown menijima, ali postojeći zapisi koji ih koriste ostaju nepromijenjeni.
        </p>
      </div>
    </div>
  )
}
