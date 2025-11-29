'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface AuditLog {
  id: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  action: string
  entityType: string
  entityId: string | null
  changes: any
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function AuditLogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Filters
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [total, setTotal] = useState(0)
  const totalPages = Math.ceil(total / limit)

  const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'

  const actionLabels: Record<string, string> = {
    'CREATE': 'Kreiranje',
    'UPDATE': 'Ažuriranje',
    'DELETE': 'Brisanje',
    'LOGIN': 'Prijava',
    'LOGOUT': 'Odjava',
    'EXPORT_PDF': 'PDF Export',
    'BULK_EXPORT': 'Bulk Export'
  }

  const entityTypeLabels: Record<string, string> = {
    'User': 'Korisnik',
    'Warehouse': 'Skladište',
    'FuelEntry': 'Prijava goriva',
    'Supplier': 'Dobavljač',
    'Transporter': 'Prevoznik'
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
    fetchLogs()
  }, [page, userFilter, actionFilter, entityTypeFilter, dateFromFilter, dateToFilter])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.success) {
        // Handle paginated response - users are in data.data.items
        setUsers(data.data.items || data.data.users || data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(userFilter && { userId: userFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(entityTypeFilter && { entityType: entityTypeFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      })

      const res = await fetch(`/api/audit-logs?${params}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.data.logs)
        setTotal(data.data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setUserFilter('')
    setActionFilter('')
    setEntityTypeFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setPage(1)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-status-success/10 text-status-success'
      case 'UPDATE': return 'bg-primary-blue/10 text-primary-blue'
      case 'DELETE': return 'bg-status-danger/10 text-status-danger'
      case 'LOGIN': return 'bg-status-success/10 text-status-success'
      case 'LOGOUT': return 'bg-gray-100 text-gray-600'
      case 'EXPORT_PDF': return 'bg-purple-100 text-purple-600'
      case 'BULK_EXPORT': return 'bg-purple-100 text-purple-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary">Audit Logovi</h1>
        <p className="text-text-secondary mt-1">
          Pregled svih aktivnosti u sistemu
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Filteri</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-blue hover:text-primary-blue-hover"
          >
            Očisti filtere
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Korisnik
              </label>
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value)
                  setPage(1)
                }}
                className="input w-full"
              >
                <option value="">Svi korisnici</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Akcija
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              className="input w-full"
            >
              <option value="">Sve akcije</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tip entiteta
            </label>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value)
                setPage(1)
              }}
              className="input w-full"
            >
              <option value="">Svi tipovi</option>
              {Object.entries(entityTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Datum od
            </label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => {
                setDateFromFilter(e.target.value)
                setPage(1)
              }}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Datum do
            </label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => {
                setDateToFilter(e.target.value)
                setPage(1)
              }}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
            <p className="text-text-secondary mt-4">Učitavanje...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">Nema logova koji odgovaraju kriterijima</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Vrijeme</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Korisnik</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Akcija</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Tip</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Entity ID</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">Detalji</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border hover:bg-bg-secondary transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-text-primary">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-text-primary font-medium">
                          {log.user.name}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {log.user.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-text-primary">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </td>
                      <td className="py-3 px-4">
                        {log.entityId ? (
                          <span className="font-mono text-xs text-text-secondary">
                            {log.entityId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.changes && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-sm text-primary-blue hover:text-primary-blue-hover font-medium"
                          >
                            Vidi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
                <div className="text-sm text-text-secondary">
                  Prikazano {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} od {total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prethodna
                  </button>
                  <span className="px-4 py-2 text-sm text-text-secondary">
                    Stranica {page} od {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sljedeća
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-bg-primary rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text-primary">Detalji promjena</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-text-secondary hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              <div className="mb-4">
                <div className="text-sm text-text-secondary mb-1">Akcija</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                  {actionLabels[selectedLog.action] || selectedLog.action}
                </span>
              </div>
              <div className="mb-4">
                <div className="text-sm text-text-secondary mb-1">Korisnik</div>
                <div className="text-sm text-text-primary">{selectedLog.user.name} ({selectedLog.user.email})</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-text-secondary mb-1">Vrijeme</div>
                <div className="text-sm text-text-primary">{formatDateTime(selectedLog.timestamp)}</div>
              </div>
              {selectedLog.entityId && (
                <div className="mb-4">
                  <div className="text-sm text-text-secondary mb-1">Entity ID</div>
                  <div className="text-sm font-mono text-text-primary">{selectedLog.entityId}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-text-secondary mb-2">Promjene</div>
                <pre className="bg-bg-secondary rounded-lg p-4 text-xs text-text-primary overflow-x-auto">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn-primary"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
