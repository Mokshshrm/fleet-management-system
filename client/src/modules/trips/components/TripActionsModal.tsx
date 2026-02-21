import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { tripService } from '../tripService'
import type { Trip } from '@/types'
import { Modal, Button, StatusBadge, Input, Textarea } from '@/components/ui'
import { cancelTripSchema, rateTripSchema, podSchema, type CancelTripFormValues, type RateTripFormValues, type PodFormValues } from '@/schemas'
import { useAuthStore } from '@/store'
import { getErrorMessage, formatDate, formatDateTime } from '@/utils'

interface Props {
  isOpen: boolean
  trip?: Trip
  onClose: () => void
}

export function TripActionsModal({ isOpen, trip, onClose }: Props) {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const [view, setView] = useState<'main' | 'cancel' | 'rate' | 'pod'>('main')

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['trips'] })
    onClose()
    setView('main')
  }

  const dispatchMutation = useMutation({
    mutationFn: () => tripService.dispatch(trip!._id),
    onSuccess: () => { toast.success('Trip dispatched'); invalidate() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const completeMutation = useMutation({
    mutationFn: (odometer: number) => tripService.complete(trip!._id, odometer),
    onSuccess: () => { toast.success('Trip completed'); invalidate() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelForm = useForm<CancelTripFormValues>({ resolver: zodResolver(cancelTripSchema) })
  const cancelMutation = useMutation({
    mutationFn: ({ cancelReason }: CancelTripFormValues) => tripService.cancel(trip!._id, cancelReason),
    onSuccess: () => { toast.success('Trip cancelled'); invalidate() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const rateForm = useForm<RateTripFormValues>({ resolver: zodResolver(rateTripSchema) })
  const rateMutation = useMutation({
    mutationFn: ({ score, feedback }: RateTripFormValues) => tripService.rate(trip!._id, score, feedback),
    onSuccess: () => { toast.success('Trip rated'); invalidate() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const podForm = useForm<PodFormValues>({ resolver: zodResolver(podSchema) })
  const podMutation = useMutation({
    mutationFn: (values: PodFormValues) => tripService.addProofOfDelivery(trip!._id, values),
    onSuccess: () => { toast.success('POD submitted'); invalidate() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (!trip) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setView('main') }}
      title="Trip Actions"
      size="md"
    >
      {view === 'main' && (
        <div className="space-y-3">
          {/* Trip summary */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={trip.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Origin</span>
              <span className="text-slate-800 font-medium text-right max-w-[200px] truncate">{trip.origin.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destination</span>
              <span className="text-slate-800 font-medium text-right max-w-[200px] truncate">{trip.destination.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Departure</span>
              <span>{formatDateTime(trip.schedule?.plannedDepartureTime)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            {trip.status === 'draft' && hasRole('dispatcher') && (
              <Button
                variant="secondary"
                size="sm"
                className="col-span-2"
                loading={dispatchMutation.isPending}
                onClick={() => dispatchMutation.mutate()}
              >
                Dispatch Trip
              </Button>
            )}
            {trip.status === 'dispatched' && hasRole('dispatcher') && (
              <Button
                variant="secondary"
                size="sm"
                className="col-span-2"
                loading={dispatchMutation.isPending}
                onClick={() => {
                  const od = Number(prompt('Enter start odometer reading:'))
                  if (od) tripService.start(trip._id, od).then(() => { toast.success('Trip started'); invalidate() })
                }}
              >
                Start Trip
              </Button>
            )}
            {trip.status === 'in_progress' && hasRole('driver') && (
              <Button
                variant="secondary"
                size="sm"
                loading={completeMutation.isPending}
                onClick={() => {
                  const od = Number(prompt('Enter end odometer reading:'))
                  if (od) completeMutation.mutate(od)
                }}
              >
                Complete
              </Button>
            )}
            {trip.status === 'in_progress' && hasRole('driver') && (
              <Button variant="outline" size="sm" onClick={() => setView('pod')}>
                Add POD
              </Button>
            )}
            {trip.status === 'completed' && hasRole('dispatcher') && !trip.rating && (
              <Button variant="outline" size="sm" onClick={() => setView('rate')}>
                Rate Trip
              </Button>
            )}
            {['draft', 'scheduled', 'dispatched'].includes(trip.status) && hasRole('dispatcher') && (
              <Button variant="danger" size="sm" onClick={() => setView('cancel')}>
                Cancel Trip
              </Button>
            )}
          </div>
        </div>
      )}

      {view === 'cancel' && (
        <div className="space-y-3">
          <Textarea
            label="Cancellation Reason"
            placeholder="Explain why this trip is being cancelled…"
            required
            error={cancelForm.formState.errors.cancelReason?.message}
            {...cancelForm.register('cancelReason')}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setView('main')}>Back</Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelMutation.isPending}
              onClick={cancelForm.handleSubmit((v) => cancelMutation.mutate(v))}
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      )}

      {view === 'rate' && (
        <div className="space-y-3">
          <Input
            label="Rating (1–5)"
            type="number"
            min={1}
            max={5}
            placeholder="5"
            required
            error={rateForm.formState.errors.score?.message}
            {...rateForm.register('score')}
          />
          <Textarea
            label="Feedback"
            placeholder="Optional feedback…"
            {...rateForm.register('feedback')}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setView('main')}>Back</Button>
            <Button
              size="sm"
              loading={rateMutation.isPending}
              onClick={rateForm.handleSubmit((v) => rateMutation.mutate(v))}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      )}

      {view === 'pod' && (
        <div className="space-y-3">
          <Input
            label="Recipient Name"
            placeholder="John Doe"
            {...podForm.register('recipientName')}
          />
          <Textarea
            label="Notes"
            placeholder="Delivery notes…"
            {...podForm.register('notes')}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setView('main')}>Back</Button>
            <Button
              size="sm"
              loading={podMutation.isPending}
              onClick={podForm.handleSubmit((v) => podMutation.mutate(v))}
            >
              Submit POD
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
