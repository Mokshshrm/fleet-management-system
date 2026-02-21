import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { driverService } from '@/services'
import { incidentSchema, type IncidentFormValues } from '@/schemas'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'
import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  driverId: string
  onClose: () => void
}

const incidentTypeOptions = [
  { value: 'accident', label: 'Accident' },
  { value: 'violation', label: 'Traffic Violation' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'other', label: 'Other' },
]

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export function IncidentModal({ isOpen, driverId, onClose }: Props) {
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { severity: 'low', resolved: false },
  })

  useEffect(() => {
    if (isOpen) reset({ severity: 'low', date: new Date().toISOString().split('T')[0], resolved: false })
  }, [isOpen, reset])

  const mutation = useMutation({
    mutationFn: (values: IncidentFormValues) => driverService.addIncident(driverId, values),
    onSuccess: () => {
      toast.success('Incident recorded')
      qc.invalidateQueries({ queryKey: ['driver', driverId] })
      qc.invalidateQueries({ queryKey: ['drivers'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Incident"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={mutation.isPending}
            onClick={handleSubmit((v) => mutation.mutate(v))}
          >
            Record Incident
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            {...register('date')}
            error={errors.date?.message}
          />
          <Select
            label="Severity"
            options={severityOptions}
            {...register('severity')}
            error={errors.severity?.message}
          />
        </div>
        <Select
          label="Incident Type"
          options={incidentTypeOptions}
          {...register('type')}
          error={errors.type?.message}
        />
        <Input
          label="Location (optional)"
          placeholder="City, Road, etc."
          {...register('location')}
          error={errors.location?.message}
        />
        <Textarea
          label="Description"
          rows={3}
          {...register('description')}
          error={errors.description?.message}
        />
      </form>
    </Modal>
  )
}
