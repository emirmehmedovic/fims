'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import EditFuelEntryModal from './EditFuelEntryModal'
import ViewFuelEntryModal from './ViewFuelEntryModal'

interface FuelEntry {
  id: string
  registrationNumber: number
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
  }
  certificatePath: string | null
  certificateFileName: string | null
  createdAt: string
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

  const canEdit = session?.user?.role === 'SUPER_ADMIN' ||
                  session?.user?.role === 'ADMIN' ||
                  session?.user?.role === 'OPERATOR'

  const canDelete = session?.user?.role === 'SUPER_ADMIN' ||
                    session?.user?.role === 'ADMIN'

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                Reg. broj
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                Datum ulaza
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                Skladište
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                Proizvod
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">
                Količina
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                Otpremnica
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                Operator
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-text-secondary">
                Status
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-border hover:bg-bg-secondary transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-mono font-semibold text-primary-blue">
                    {entry.registrationNumber}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-primary">
                  {formatDate(entry.entryDate)}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-text-primary font-medium">
                    {entry.warehouse.code}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {entry.warehouse.name}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-text-primary">
                    {entry.productName}
                  </div>
                  {entry.isHigherQuality && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-primary-blue/10 text-primary-blue">
                      Viša kvaliteta
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="text-sm font-semibold text-text-primary">
                    {entry.quantity.toLocaleString()} L
                  </div>
                </td>
                <td className="py-3 px-4">
                  {entry.deliveryNoteNumber ? (
                    <>
                      <div className="text-sm text-text-primary">
                        {entry.deliveryNoteNumber}
                      </div>
                      {entry.deliveryNoteDate && (
                        <div className="text-xs text-text-secondary">
                          {formatDate(entry.deliveryNoteDate)}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-text-tertiary">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-text-primary">
                    {entry.operator.name}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatDateTime(entry.createdAt)}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {entry.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success">
                        Aktivna
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-danger/10 text-status-danger">
                        Obrisana
                      </span>
                    )}
                    {entry.certificatePath && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary"
                        title="Ima certifikat"
                      >
                        📄
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setViewingEntry(entry)}
                      className="text-sm text-primary-blue hover:text-primary-blue-hover font-medium"
                    >
                      Pregled
                    </button>
                    {canEdit && entry.isActive && (
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-sm text-primary-blue hover:text-primary-blue-hover font-medium"
                      >
                        Uredi
                      </button>
                    )}
                    {canDelete && entry.isActive && (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-sm text-status-danger hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {deletingId === entry.id ? 'Brisanje...' : 'Obriši'}
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
