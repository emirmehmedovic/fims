'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users as UsersIcon, Plus, Search, Filter } from 'lucide-react'
import UserTable from '@/components/users/UserTable'
import CreateUserModal from '@/components/users/CreateUserModal'
import EditUserModal from '@/components/users/EditUserModal'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { isActive: statusFilter })
      })

      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data.items)
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        }))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, search, roleFilter, statusFilter])

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovog korisnika?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const activeUsers = users.filter(u => u.isActive).length
  const inactiveUsers = users.filter(u => !u.isActive).length

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-[var(--shadow-soft-xl)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
                <p className="text-dark-300 text-sm">
                  Upravljanje korisnicima sistema
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white text-dark-900 rounded-2xl font-semibold hover:bg-dark-50 transition-all shadow-[var(--shadow-soft)] flex items-center gap-2"
            >
              <Plus size={20} />
              Novi Korisnik
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-6">
          {[
            {
              title: 'Ukupno korisnika',
              value: pagination.total?.toLocaleString() || '0',
              icon: UsersIcon,
              trend: 'Svi',
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              badge: 'Sistem',
            },
            {
              title: 'Aktivni korisnici',
              value: activeUsers,
              icon: UsersIcon,
              trend: 'Online',
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-50',
              badge: 'Aktivno',
            },
            {
              title: 'Neaktivni',
              value: inactiveUsers,
              icon: UsersIcon,
              trend: 'Offline',
              color: 'text-red-600',
              bgColor: 'bg-red-50',
              badge: 'Neaktivno',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="stat-card flex flex-col justify-between h-[160px] basis-full md:basis-[calc(33.333%-16px)] flex-grow"
              style={{ minWidth: '200px' }}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-3.5 rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                  {item.badge}
                </span>
              </div>
              <div className="relative z-10">
                <h4 className="text-3xl font-bold text-dark-900 mb-1">{item.value}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dark-500">{item.title}</span>
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full ml-auto">{item.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-soft)] border border-dark-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Pretraži po imenu ili email-u..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full pl-10"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">Sve uloge</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="VIEWER">Viewer</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Svi statusi</option>
              <option value="true">Aktivni</option>
              <option value="false">Neaktivni</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <UserTable
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-6 py-3 bg-white border border-dark-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 transition-all shadow-[var(--shadow-soft)]"
            >
              Prethodna
            </button>

            <span className="px-6 py-3 bg-white rounded-xl font-medium border border-dark-100 shadow-[var(--shadow-soft)]">
              Stranica {pagination.page} od {pagination.totalPages}
            </span>

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-6 py-3 bg-white border border-dark-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 transition-all shadow-[var(--shadow-soft)]"
            >
              Sljedeća
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchUsers()
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedUser(null)
            fetchUsers()
          }}
        />
      )}
    </>
  )
}
