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

  return (
    <div className="min-h-screen bg-bg-secondary p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <UsersIcon size={32} className="text-primary-blue" />
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-primary-gray">Upravljanje korisnicima sistema</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Novi Korisnik
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-gray" />
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
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-lg disabled:opacity-50"
            >
              Prethodna
            </button>

            <span className="px-4 py-2">
              Stranica {pagination.page} od {pagination.totalPages}
            </span>

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-lg disabled:opacity-50"
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
    </div>
  )
}
