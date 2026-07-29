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

// Role styling configuration
const getRoleConfig = (role: string) => {
  switch (role) {
    case 'PUMPA':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        borderColor: 'border-orange-200',
        avatarBg: 'bg-orange-500',
        label: 'Pumpa',
        Icon: Fuel
      }
    case 'OPERATOR':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        avatarBg: 'bg-blue-500',
        label: 'Operator',
        Icon: Warehouse
      }
    case 'ADMIN':
      return {
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-200',
        avatarBg: 'bg-purple-500',
        label: 'Admin',
        Icon: Shield
      }
    case 'SUPER_ADMIN':
      return {
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-600',
        borderColor: 'border-rose-200',
        avatarBg: 'bg-rose-500',
        label: 'Super Admin',
        Icon: Shield
      }
    case 'VIEWER':
      return {
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-200',
        avatarBg: 'bg-slate-500',
        label: 'Viewer',
        Icon: Eye
      }
    default:
      return {
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-200',
        avatarBg: 'bg-slate-500',
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
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">
                      {entry.warehouse.code}
                    </span>
                    <span className="text-xs text-slate-500">
                      {entry.warehouse.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {entry.client ? (
                    <div className="flex flex-col">
                      {entry.client.code && (
                        <span className="text-xs text-slate-500 font-mono">
                          {entry.client.code}
                        </span>
                      )}
                      <span className="text-sm text-slate-700">
                        {entry.client.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-700 font-medium">
                    {entry.productName}
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
                        <div className={`w-7 h-7 rounded-full ${roleConfig.avatarBg} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
                          {entry.operator.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-700">
                              {entry.operator.name}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${roleConfig.bgColor} ${roleConfig.textColor} border ${roleConfig.borderColor}`}>
                              <RoleIcon className="w-2.5 h-2.5" />
                              {roleConfig.label}
                            </span>
                          </div>
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
