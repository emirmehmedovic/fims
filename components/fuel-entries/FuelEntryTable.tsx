'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'
import { Fuel, Warehouse, Shield, User, Eye } from 'lucide-react'
import EditFuelEntryModal from './EditFuelEntryModal'
import ViewFuelEntryModal from './ViewFuelEntryModal'

interface FuelEntry {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: string
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  isHigherQuality: boolean
  isActive: boolean
  warehouse: {
    id: string
    name: string
    code: string
  }
  operator: {
    id: string
    name: string
    email: string
    role: string
  }
  client?: {
    id: string
    name: string
    code: string | null
  } | null
  certificatePath: string | null
  certificateFileName: string | null
  createdAt: string
}

// Role styling configuration - subtle colors
const getRoleConfig = (role: string) => {
  switch (role) {
    case 'PUMPA':
      return {
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        label: 'Pumpa',
        Icon: Fuel
      }
    case 'OPERATOR':
      return {
        bgColor: 'bg-sky-50',
        textColor: 'text-sky-700',
        label: 'Operator',
        Icon: Warehouse
      }
    case 'ADMIN':
      return {
        bgColor: 'bg-violet-50',
        textColor: 'text-violet-700',
        label: 'Admin',
        Icon: Shield
      }
    case 'SUPER_ADMIN':
      return {
        bgColor: 'bg-fuchsia-50',
        textColor: 'text-fuchsia-700',
        label: 'S. Admin',
        Icon: Shield
      }
    case 'VIEWER':
      return {
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-600',
        label: 'Viewer',
        Icon: Eye
      }
    default:
      return {
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-600',
        label: role,
        Icon: User
      }
  }
}

interface Props {
  entries: FuelEntry[]
  onEntryDeleted: () => void
}

export default function FuelEntryTable({ entries, onEntryDeleted }: Props) {
  const { data: session } = useSession()
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null)
  const [viewingEntry, setViewingEntry] = useState<FuelEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const userRole = session?.user?.role
  const userId = session?.user?.id

  // Check if user can edit/delete - for PUMPA, only their own entries
  const canEditEntry = (entry: FuelEntry) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'OPERATOR') {
      return true
    }
    if (userRole === 'PUMPA' && entry.operator.id === userId) {
      return true
    }
    return false
  }

  const canDeleteEntry = (entry: FuelEntry) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return true
    }
    if (userRole === 'PUMPA' && entry.operator.id === userId) {
      return true
    }
    return false
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu prijavu?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/fuel-entries/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        alert('Prijava uspješno obrisana')
        onEntryDeleted()
      } else {
        alert(data.error || 'Greška pri brisanju prijave')
      }
    } catch (error) {
      alert('Greška pri brisanju prijave')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => formatDateSarajevo(dateString)
  const formatDateTime = (dateString: string) => formatDateTimeSarajevo(dateString)

  return (
    <>
      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <tr>
              <th className="text-center px-3 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 w-12">
                #
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Reg. broj
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Datum ulaza
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Skladište
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Firma (Klijent)
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Proizvod
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Količina
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Otpremnica
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Operator
              </th>
              <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Status
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                className={`transition-all duration-200 cursor-pointer group ${
                  entry.isActive
                    ? `hover:bg-blue-50/50 hover:shadow-[inset_4px_0_0_0_rgb(59,130,246)] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`
                    : 'bg-rose-50/50 hover:bg-rose-100/50 opacity-60'
                }`}
                onClick={() => setViewingEntry(entry)}
              >
                <td className="px-3 py-4 text-center">
                  <span className="text-xs font-medium text-slate-400">{index + 1}</span>
                </td>
                <td className="px-6 py-4">
                  <div className={`font-mono font-bold inline-block px-2.5 py-1.5 rounded-lg text-sm transition-all duration-200 group-hover:scale-105 ${
                    entry.isActive
                      ? 'text-slate-700 bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700'
                      : 'text-rose-700 bg-rose-100 line-through'
                  }`}>
                    {entry.declarationNumber || entry.registrationNumber}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDate(entry.entryDate)}
                </td>
                <td className="px-6 py-4">
                  {entry.warehouse.code === 'DEF-001' ? (
                    <div className="flex items-center" title="HIFA-PETROL">
                      <svg className="w-8 h-10" viewBox="0 0 70.9 91" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M60.9,89.6h-58c-0.8,0-1.3-0.8-0.9-1.5l4.6-7.9c0.7-1.3,2.1-2,3.5-2h58c0.8,0,1.3,0.8,0.9,1.5l-4.6,7.9C63.7,88.8,62.3,89.6,60.9,89.6" fill="#D02A28"/>
                        <path d="M15.5,86.6h-1.2v-2.3h-1.5v2.3h-1.2v-5.5h1.2v2.3h1.5v-2.3h1.2V86.6z M17.2,81.1h1.2v5.5h-1.2V81.1z M20,86.6v-5.5h3.2v1h-2v1.3h1.7v0.9h-1.7v2.3H20z M26.7,85.6h-1.5L25,86.6h-1.2l1.4-5.5h1.5l1.5,5.5h-1.2L26.7,85.6z M25.4,84.6h1L26,82.1h0L25.4,84.6z M32.8,83.8c0.3,0,0.5-0.1,0.6-0.2c0.1-0.1,0.2-0.3,0.2-0.7c0-0.3-0.1-0.5-0.2-0.7c-0.1-0.1-0.3-0.2-0.6-0.2h-0.7v1.7H32.8z M30.9,81.1h1.9c0.3,0,0.6,0,0.9,0.1c0.2,0,0.5,0.1,0.6,0.3c0.2,0.1,0.3,0.3,0.4,0.5c0.1,0.2,0.1,0.5,0.1,0.9c0,0.4,0,0.6-0.1,0.9c-0.1,0.2-0.2,0.4-0.4,0.5c-0.2,0.1-0.4,0.2-0.6,0.3c-0.2,0.1-0.5,0.1-0.9,0.1h-0.7v1.9h-1.2V81.1z M36.2,81.1h3.4v1h-2.2v1.3h1.9v0.9h-1.9v1.4h2.2v1h-3.4V81.1z M41.9,82.1h-1.2v-1h3.6v1h-1.2v4.6h-1.2V82.1z M45.6,81.1h1.9c0.3,0,0.6,0,0.9,0.1c0.2,0,0.5,0.1,0.6,0.3c0.2,0.1,0.3,0.3,0.4,0.5c0.1,0.2,0.1,0.5,0.1,0.9c0,0.5-0.1,0.8-0.2,1.1s-0.4,0.4-0.7,0.6l1,2.1h-1.3l-0.9-1.9h-0.6v1.9h-1.2V81.1z M47.5,83.8c0.3,0,0.5-0.1,0.6-0.2c0.1-0.1,0.2-0.3,0.2-0.7c0-0.3-0.1-0.5-0.2-0.7c-0.1-0.1-0.3-0.2-0.6-0.2h-0.7v1.7H47.5z M53.7,82.9c0-0.3-0.1-0.5-0.2-0.7C53.4,82,53.2,82,52.9,82c-0.3,0-0.5,0.1-0.6,0.2c-0.1,0.1-0.2,0.4-0.2,0.7v2c0,0.3,0.1,0.5,0.2,0.7s0.3,0.2,0.6,0.2c0.3,0,0.5-0.1,0.7-0.2s0.2-0.4,0.2-0.7V82.9z M50.9,82.9c0-0.6,0.2-1.1,0.5-1.4c0.3-0.3,0.8-0.5,1.6-0.5c0.7,0,1.2,0.2,1.6,0.5c0.3,0.3,0.5,0.8,0.5,1.4v2c0,0.6-0.2,1.1-0.5,1.4c-0.3,0.3-0.8,0.5-1.6,0.5c-0.7,0-1.2-0.2-1.6-0.5c-0.3-0.3-0.5-0.8-0.5-1.4V82.9z M56.4,81.1h1.2v4.6h1.7v1h-2.9V81.1z" fill="#FFFFFF" fillRule="evenodd" clipRule="evenodd"/>
                        <path d="M55.8,26.9h12.4c0.8,0,1.3,0.9,0.9,1.5L55.8,51.3c-0.7,1.3-2.1,2-3.5,2H41.1c-0.8,0-1.3-0.8-0.9-1.5l13.8-24C54.4,27.3,55,26.9,55.8,26.9" fill="#D02A28" fillRule="evenodd" clipRule="evenodd"/>
                        <path d="M49,26.9H33.3c-0.7,0-1.2-0.7-0.9-1.4l1-1.7l4.7-8.2c0.7-1.3,0.7-2.8,0-4.1l-5.6-9.7c-0.4-0.7-1.4-0.7-1.8,0L1.9,51.9c-0.4,0.7,0.1,1.5,0.9,1.5h11.1c1.5,0,2.8-0.8,3.5-2l11.3-19.6l0,0c0.3-0.4,0.8-0.7,1.3-0.8c1-0.1,2.3,0,2.3,0.9c0,0.3-0.1,0.5-0.2,0.8L13.4,65.1c-0.4,0.7,0.1,1.5,0.9,1.5h11.2c1.5,0,2.8-0.8,3.5-2l20.9-36.2C50.3,27.7,49.8,26.9,49,26.9" fill="#D02A28"/>
                      </svg>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-700">
                      {entry.warehouse.name}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {entry.client ? (
                    <span className="text-sm text-slate-700">
                      {entry.client.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="relative group/tooltip">
                    <div className="text-sm text-slate-700 font-medium max-w-[200px] truncate cursor-default">
                      {entry.productName}
                    </div>
                    <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity z-50">
                      {entry.productName}
                    </div>
                  </div>
                  {entry.isHigherQuality && (
                    <img
                      src="/Screenshot_8.png"
                      alt="Premium"
                      className="h-6 w-auto rounded-md mt-1.5 shadow-sm object-contain opacity-90 hover:opacity-100 transition-opacity"
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-sm font-bold text-slate-700">
                    {entry.quantity.toLocaleString()} <span className="text-slate-400 font-normal text-xs">L</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {entry.deliveryNoteNumber ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-medium">
                        {entry.deliveryNoteNumber}
                      </span>
                      {entry.deliveryNoteDate && (
                        <span className="text-xs text-slate-500">
                          {formatDate(entry.deliveryNoteDate)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const roleConfig = getRoleConfig(entry.operator.role)
                    const RoleIcon = roleConfig.Icon
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${roleConfig.bgColor} flex items-center justify-center`} title={roleConfig.label}>
                          <RoleIcon className={`w-3.5 h-3.5 ${roleConfig.textColor}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">
                            {entry.operator.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {entry.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Aktivna
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                        Obrisana
                      </span>
                    )}
                    {entry.certificatePath && (
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Ima certifikat"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingEntry(entry)
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Pregled"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {canEditEntry(entry) && entry.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingEntry(entry)
                        }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                        title="Uredi"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {canDeleteEntry(entry) && entry.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(entry.id)
                        }}
                        disabled={deletingId === entry.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 opacity-0 group-hover:opacity-100"
                        title="Obriši"
                      >
                        {deletingId === entry.id ? (
                          <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <EditFuelEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSuccess={() => {
            setEditingEntry(null)
            onEntryDeleted() // Refresh list
          }}
        />
      )}

      {/* View Modal */}
      {viewingEntry && (
        <ViewFuelEntryModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </>
  )
}
