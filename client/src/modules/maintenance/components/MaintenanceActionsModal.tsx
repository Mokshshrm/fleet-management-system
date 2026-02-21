import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, PlayCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { maintenanceService } from '@/services'
import { completeMaintenanceSchema, type CompleteMaintenanceFormValues } from '@/schemas'
import type { MaintenanceLog } from '@/types'
import { Modal, Button, Input, Textarea, StatusBadge } from '@/components/ui'
import { formatDate, getErrorMessage, humanize } from '@/utils'

interface Props {
  isOpen: boolean
  log?: MaintenanceLog
  onClose: () => void
}

type View = 'main' | 'complete'

export function MaintenanceActionsModal({ isOpen, log, onClose }: Props) {
  const qc = useQueryClient()
  const [view, setView] = useState<View>('main')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteMaintenanceFormValues>({
    resolver: zodResolver(completeMaintenanceSchema),
    defaultValues: { completedAt: new Date().toISOString().split('T')[0] },
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['maintenance'] })
    qc.invalidateQueries({ queryKey: ['maintenance-stats'] })
    qc.invalidateQueries({ queryKey: ['vehicles'] })
  }

  const startMutation = useMutation({
    mutationFn: () => maintenanceService.start(log!._id),
    onSuccess: () => { toast.success('Maintenance started'); invalidate(); onClose() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const completeMutation = useMutation({
    mutationFn: (values: CompleteMaintenanceFormValues) =>
      maintenanceService.complete(log!._id, values.completedAt, values.notes),
    onSuccess: () => { toast.success('Maintenance completed'); invalidate(); onClose() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelMutation = useMutation({
    mutationFn: () => maintenanceService.cancel(log!._id),
    onSuccess: () => { toast.success('Maintenance cancelled'); invalidate(); onClose() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleClose = () => { setView('main'); reset(); onClose() }

  if (!log) return null

  if (view === 'complete') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Complete Maintenance"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setView('main')}>Back</Button>
            <Button
              loading={completeMutation.isPending}
              onClick={handleSubmit((v) => completeMutation.mutate(v))}
            >
              Mark Complete
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Completion Date"
            type="date"
            {...register('completedAt')}
            error={errors.completedAt?.message}
          />
          <Textarea
            label="Completion Notes (optional)"
            rows={3}
            {...register('notes')}
            error={errors.notes?.message}
          />
        </form>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Maintenance Actions"
      size="sm"
      footer={
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      }
    >
      <div className="space-y-4">
        {/* Info */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm space-y-1">
          <p className="font-medium text-slate-800">{log.maintenanceNumber ?? log.description}</p>
          <p className="text-xs text-slate-500">{humanize(log.type)} — Scheduled {formatDate(log.schedule?.scheduledDate)}</p>
          <StatusBadge status={log.status} />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {log.status === 'scheduled' && (
            <Button
              className="w-full justify-start"
              variant="secondary"
              leftIcon={<PlayCircle size={15} />}
              loading={startMutation.isPending}
              onClick={() => startMutation.mutate()}
            >
              Mark as In Progress
            </Button>
          )}
          {(log.status === 'scheduled' || log.status === 'in_progress') && (
            <Button
              className="w-full justify-start"
              variant="secondary"
              leftIcon={<CheckCircle size={15} />}
              onClick={() => {
                reset({ completedAt: new Date().toISOString().split('T')[0] })
                setView('complete')
              }}
            >
              Mark as Completed
            </Button>
          )}
          {log.status !== 'cancelled' && log.status !== 'completed' && (
            <Button
              className="w-full justify-start"
              variant="danger"
              leftIcon={<XCircle size={15} />}
              loading={cancelMutation.isPending}
              onClick={() => {
                if (confirm('Cancel this maintenance record?')) cancelMutation.mutate()
              }}
            >
              Cancel Maintenance
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
