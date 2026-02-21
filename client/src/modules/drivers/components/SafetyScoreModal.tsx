import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { driverService } from '@/services'
import { safetyScoreSchema, type SafetyScoreFormValues } from '@/schemas'
import { Modal, Button, Input, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'
import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  driverId: string
  currentScore: number
  onClose: () => void
}

export function SafetyScoreModal({ isOpen, driverId, currentScore, onClose }: Props) {
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SafetyScoreFormValues>({
    resolver: zodResolver(safetyScoreSchema),
  })

  useEffect(() => {
    if (isOpen) reset({ score: currentScore, reason: '' })
  }, [isOpen, currentScore, reset])

  const mutation = useMutation({
    mutationFn: ({ score, reason }: SafetyScoreFormValues) =>
      driverService.updateSafetyScore(driverId, score, reason),
    onSuccess: () => {
      toast.success('Safety score updated')
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
      title="Update Safety Score"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={mutation.isPending}
            onClick={handleSubmit((v) => mutation.mutate(v))}
          >
            Update Score
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Input
          label="Safety Score (0–100)"
          type="number"
          min={0}
          max={100}
          {...register('score')}
          error={errors.score?.message}
        />
        <Textarea
          label="Reason for change"
          rows={3}
          {...register('reason')}
          error={errors.reason?.message}
        />
      </form>
    </Modal>
  )
}
