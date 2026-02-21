import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, RefreshCw, Shield, Mail, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { userService } from '@/services'
import { authService } from '@/services'
import type { User, UserRole, UserInvitation } from '@/types'
import {
  PageHeader,
  Button,
  Select,
  DataTable,
  StatusBadge,
  Badge,
  Modal,
  Input,
  type Column,
} from '@/components/ui'
import { useAuthStore } from '@/store'
import { formatDate, getErrorMessage, humanize } from '@/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

type SettingsTab = 'users' | 'invite' | 'invitations'

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'financial_analyst', label: 'Financial Analyst' },
  { value: 'driver', label: 'Driver' },
]

const assignableRoles = roleOptions.slice(1)
const inviteAssignableRoles = roleOptions.slice(1, roleOptions.length - 1);

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  role: z.enum(['admin', 'fleet_manager', 'dispatcher', 'driver', 'safety_officer', 'financial_analyst']),
})

type InviteFormValues = z.infer<typeof inviteSchema>

function RoleChangeModal({
  user,
  isOpen,
  onClose,
}: {
  user?: User
  isOpen: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [role, setRole] = useState<UserRole>(user?.role ?? 'driver')

  const mutation = useMutation({
    mutationFn: () => userService.updateRole(user!._id, role),
    onSuccess: () => {
      toast.success('Role updated')
      qc.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (!user) return null
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change User Role"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Update Role
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Change role for <strong>{user.firstName} {user.lastName}</strong>
        </p>
        <Select
          label="New Role"
          options={assignableRoles}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        />
      </div>
    </Modal>
  )
}

export default function SettingsPage() {
  const { hasRole, user: me } = useAuthStore()
  const qc = useQueryClient()

  const [tab, setTab] = useState<SettingsTab>('users')
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [roleModal, setRoleModal] = useState<{ open: boolean; user?: User }>({ open: false })

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, roleFilter],
    queryFn: () =>
      userService.getAll({
        page,
        limit: 20,
        role: (roleFilter as UserRole) || undefined,
      }),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.toggleStatus(id, isActive),
    onSuccess: () => {
      toast.success('User status updated')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      toast.success('User removed')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({ resolver: zodResolver(inviteSchema) })

  const inviteMutation = useMutation({
    mutationFn: (values: InviteFormValues) => authService.inviteUser(values),
    onSuccess: () => {
      toast.success('Invitation sent!')
      reset()
      qc.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: authService.getInvitations,
    enabled: hasRole('admin') && tab === 'invitations',
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: (id: string) => authService.cancelInvitation(id),
    onSuccess: () => {
      toast.success('Invitation cancelled')
      qc.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const columns: Column<User>[] = [
    {
      key: 'firstName',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {row.firstName} {row.lastName}
              {row._id === me?.userId && (
                <span className="ml-1.5 text-[10px] text-slate-400">(you)</span>
              )}
            </p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant="secondary" size="sm">
          <Shield size={10} className="mr-1" />
          {humanize(row.role)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-40',
      render: (row) => {
        if (row._id === me?.userId) return null
        return (
          <div className="flex gap-1">
            {hasRole('owner') && (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setRoleModal({ open: true, user: row })
                }}
              >
                Role
              </Button>
            )}
            {hasRole('admin') && (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStatusMutation.mutate({
                    id: row._id,
                    isActive: !row.isActive,
                  })
                }}
              >
                {row.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            )}
            {hasRole('owner') && (
              <Button
                variant="ghost"
                size="xs"
                className="text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Remove this user from the company?')) {
                    deleteMutation.mutate(row._id)
                  }
                }}
              >
                Remove
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Manage team members and access" />

      {/* Tabs */}
      <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden w-fit shadow-sm">
        {(['users', 'invitations', 'invite'] as SettingsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t === 'users' ? 'Team Members' : t === 'invitations' ? 'Invitations' : 'Invite User'}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1) }}
              wrapperClassName="min-w-[160px]"
            />
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw size={13} />}
              onClick={() => qc.invalidateQueries({ queryKey: ['users'] })}
            >
              Refresh
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
            <DataTable
              columns={columns}
              data={data?.users ?? []}
              keyExtractor={(u) => u._id}
              loading={isLoading}
              error={error ? getErrorMessage(error) : null}
              emptyTitle="No users found"
              emptyDescription="Invite your first team member."
              emptyAction={
                hasRole('admin') ? (
                  <Button size="sm" leftIcon={<UserPlus size={13} />} onClick={() => setTab('invite')}>
                    Invite User
                  </Button>
                ) : undefined
              }
              pagination={
                data?.pagination
                  ? {
                      page: data.pagination.page,
                      pages: data.pagination.pages,
                      total: data.pagination.total,
                      limit: data.pagination.limit,
                      onPageChange: setPage,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {tab === 'invitations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-1">
          <DataTable
            columns={[
              {
                key: 'email',
                header: 'Email',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Mail size={14} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-900">{row.email}</span>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Role',
                render: (row) => (
                  <Badge variant="secondary" size="sm">
                    <Shield size={10} className="mr-1" />
                    {humanize(row.role)}
                  </Badge>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: 'createdAt',
                header: 'Sent',
                render: (row) => formatDate(row.createdAt),
              },
              {
                key: 'expiresAt',
                header: 'Expires',
                render: (row) => formatDate(row.expiresAt),
              },
              {
                key: 'actions',
                header: '',
                className: 'w-24',
                render: (row) => (
                  row.status === 'pending' ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-red-500"
                      leftIcon={<Trash2 size={12} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Cancel this invitation?')) {
                          cancelInvitationMutation.mutate(row._id)
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null
                ),
              },
            ]}
            data={invitations ?? []}
            keyExtractor={(inv) => inv._id}
            loading={invitationsLoading}
            emptyTitle="No invitations"
            emptyDescription="Send an invitation to add team members."
            emptyAction={
              <Button size="sm" leftIcon={<UserPlus size={13} />} onClick={() => setTab('invite')}>
                Invite User
              </Button>
            }
          />
        </div>
      )}

      {/* Invite Tab */}
      {tab === 'invite' && (
        <div className="max-w-md">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800">Invite a Team Member</h3>
              <p className="text-sm text-slate-500 mt-1">
                They'll receive an email to set up their password.
              </p>
            </div>
            <form
              className="space-y-4"
              onSubmit={handleSubmit((v) => inviteMutation.mutate(v))}
            >
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Select
                label="Role"
                options={inviteAssignableRoles}
                {...register('role')}
                error={errors.role?.message}
              />
              <Button
                type="submit"
                className="w-full"
                leftIcon={<UserPlus size={14} />}
                loading={inviteMutation.isPending}
              >
                Send Invitation
              </Button>
            </form>
          </div>
        </div>
      )}

      <RoleChangeModal
        isOpen={roleModal.open}
        user={roleModal.user}
        onClose={() => setRoleModal({ open: false })}
      />
    </div>
  )
}
