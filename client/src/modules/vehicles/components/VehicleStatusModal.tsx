import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { vehicleService } from '@/services'
import type { Vehicle, VehicleStatus } from '@/types'
import { Modal, Button, Select } from '@/components/ui'
import { getErrorMessage, humanize } from '@/utils'

const STATUS_OPTIONS: VehicleStatus[] = [
  'available',
  'on_trip',
  'in_shop',
  'out_of_service',
  'retired',
]

interface Props {
  isOpen: boolean
  vehicle?: Vehicle
  onClose: () => void
}

export function VehicleStatusModal({ isOpen, vehicle, onClose }: Props) {
  const qc = useQueryClient()
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status ?? 'available')

  const mutation = useMutation({
    mutationFn: () => vehicleService.updateStatus(vehicle!._id, status),
    onSuccess: () => {
      toast.success('Vehicle status updated')
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Vehicle Status"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Update Status
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          Changing status for <strong>{vehicle?.name}</strong>
        </p>
        <Select
          label="New Status"
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: humanize(s) }))}
          value={status}
          onChange={(e) => setStatus(e.target.value as VehicleStatus)}
        />
      </div>
    </Modal>
  )
}
