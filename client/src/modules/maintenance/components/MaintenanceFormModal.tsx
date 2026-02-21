import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { maintenanceService, vehicleService } from '@/services'
import { maintenanceSchema, type MaintenanceFormValues } from '@/schemas'
import type { MaintenanceLog } from '@/types'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'

interface Props {
  isOpen: boolean
  log?: MaintenanceLog
  vehicleId?: string
  onClose: () => void
}

const typeOptions = [
  { value: 'preventive', label: 'Preventive' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'repair', label: 'Repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'emergency', label: 'Emergency' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function MaintenanceFormModal({ isOpen, log, vehicleId, onClose }: Props) {
  const qc = useQueryClient()
  const isEditing = !!log

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-all'],
    queryFn: () => vehicleService.getAll({ limit: 200 }),
    enabled: isOpen,
    select: (d) =>
      d.vehicles.map((v) => ({ value: v._id, label: `${v.licensePlate} — ${v.make} ${v.model}` })),
  })

  const vehicleOptions = [{ value: '', label: 'Select vehicle' }, ...(vehicles ?? [])]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { priority: 'medium', costCurrency: 'USD', vehicleId: vehicleId ?? '' },
  })

  useEffect(() => {
    if (isOpen) {
      if (log) {
        reset({
          vehicleId: typeof log.vehicleId === 'object' ? (log.vehicleId as any)._id : log.vehicleId,
          type: log.type,
          description: log.description ?? '',
          priority: log.priority,
          scheduledDate: log.schedule?.scheduledDate?.split('T')[0] ?? '',
          costTotal: log.cost?.total ?? 0,
          costCurrency: log.cost?.currency ?? 'USD',
          serviceProviderName: log.serviceProvider?.name ?? '',
          serviceProviderContact: log.serviceProvider?.contact ?? '',
          notes: log.notes ?? '',
          status: log.status,
        })
      } else {
        reset({ priority: 'medium', costCurrency: 'USD', vehicleId: vehicleId ?? '' })
      }
    }
  }, [isOpen, log, vehicleId, reset])

  const mutation = useMutation({
    mutationFn: (values: MaintenanceFormValues) => {
      const payload = {
        vehicleId: values.vehicleId,
        type: values.type,
        category: values.category,
        description: values.description,
        priority: values.priority,
        status: values.status,
        schedule: { scheduledDate: values.scheduledDate },
        cost: { total: values.costTotal ?? 0, currency: values.costCurrency },
        serviceProvider:
          values.serviceProviderName
            ? { name: values.serviceProviderName, contact: values.serviceProviderContact }
            : undefined,
        notes: values.notes || undefined,
      }
      return isEditing
        ? maintenanceService.update(log!._id, payload)
        : maintenanceService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Maintenance updated' : 'Maintenance scheduled')
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Maintenance' : 'Schedule Maintenance'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={handleSubmit((v) => mutation.mutate(v))}>
            {isEditing ? 'Save Changes' : 'Schedule'}
          </Button>
        </div>
      }
    >
      <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <div className="col-span-2">
          <Select
            label="Vehicle"
            options={vehicleOptions}
            {...register('vehicleId')}
            error={errors.vehicleId?.message}
          />
        </div>
        <Input
          label="Title / Description"
          {...register('description')}
          error={errors.description?.message}
          wrapperClassName="col-span-2"
        />
        <Select
          label="Type"
          options={typeOptions}
          {...register('type')}
          error={errors.type?.message}
        />
        <Select
          label="Priority"
          options={priorityOptions}
          {...register('priority')}
          error={errors.priority?.message}
        />
        <Input
          label="Scheduled Date"
          type="date"
          {...register('scheduledDate')}
          error={errors.scheduledDate?.message}
        />
        <Input
          label="Estimated Total Cost"
          type="number"
          step="0.01"
          {...register('costTotal')}
          error={errors.costTotal?.message}
        />
        <Input
          label="Service Provider Name"
          {...register('serviceProviderName')}
          error={errors.serviceProviderName?.message}
        />
        <Input
          label="Service Provider Contact"
          {...register('serviceProviderContact')}
          error={errors.serviceProviderContact?.message}
        />
        {isEditing && (
          <Select
            label="Status"
            options={statusOptions}
            {...register('status')}
            error={errors.status?.message}
          />
        )}
        <div className="col-span-2">
          <Textarea
            label="Notes"
            rows={2}
            {...register('notes')}
            error={errors.notes?.message}
          />
        </div>
      </form>
    </Modal>
  )
}
