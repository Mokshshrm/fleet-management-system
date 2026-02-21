import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { vehicleService } from '@/services'
import type { Vehicle } from '@/types'
import { vehicleSchema, type VehicleFormValues } from '@/schemas'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'

const fuelTypeOptions = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'cng', label: 'CNG' },
  { value: 'lpg', label: 'LPG' },
]

const vehicleTypeOptions = [
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'other', label: 'Other' },
]

interface Props {
  isOpen: boolean
  vehicle?: Vehicle
  onClose: () => void
}

export function VehicleFormModal({ isOpen, vehicle, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = Boolean(vehicle)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  })

  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        reset({
          name: vehicle.name,
          vehicleType: vehicle.vehicleType,
          make: vehicle.make ?? '',
          model: vehicle.model ?? '',
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin ?? '',
          fuelType: vehicle.fuelType,
          maxLoadCapacityValue: vehicle.maxLoadCapacity.value,
          maxLoadCapacityUnit: vehicle.maxLoadCapacity.unit,
          odometerCurrent: vehicle.odometer.current,
          odometerUnit: vehicle.odometer.unit,
          status: vehicle.status,
          region: vehicle.region ?? '',
          notes: vehicle.notes ?? '',
        })
      } else {
        reset()
      }
    }
  }, [isOpen, vehicle, reset])

  const mutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const payload = {
        name: values.name,
        vehicleType: values.vehicleType,
        make: values.make || undefined,
        model: values.model || undefined,
        year: values.year,
        licensePlate: values.licensePlate,
        vin: values.vin || undefined,
        fuelType: values.fuelType,
        maxLoadCapacity: {
          value: values.maxLoadCapacityValue,
          unit: values.maxLoadCapacityUnit,
        },
        odometer: { current: values.odometerCurrent, unit: values.odometerUnit },
        status: values.status,
        region: values.region || undefined,
        notes: values.notes || undefined,
      }
      if (isEdit) return vehicleService.update(vehicle!._id, payload)
      return vehicleService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Vehicle updated' : 'Vehicle added to fleet')
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={isSubmitting || mutation.isPending}
            onClick={handleSubmit((v) => mutation.mutate(v))}
          >
            {isEdit ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      }
    >
      <form className="grid grid-cols-2 gap-3">
        <Input
          label="Vehicle Name"
          placeholder="e.g. Fleet Truck 01"
          required
          error={errors.name?.message}
          wrapperClassName="col-span-2"
          {...register('name')}
        />
        <Select
          label="Vehicle Type"
          options={vehicleTypeOptions}
          required
          error={errors.vehicleType?.message}
          {...register('vehicleType')}
        />
        <Select
          label="Fuel Type"
          options={fuelTypeOptions}
          required
          error={errors.fuelType?.message}
          {...register('fuelType')}
        />
        <Input
          label="Make"
          placeholder="e.g. Mercedes-Benz"
          required
          error={errors.make?.message}
          {...register('make')}
        />
        <Input
          label="Model"
          placeholder="e.g. Actros"
          required
          error={errors.model?.message}
          {...register('model')}
        />
        <Input
          label="Year"
          type="number"
          placeholder="2023"
          required
          error={errors.year?.message}
          {...register('year')}
        />
        <Input
          label="License Plate"
          placeholder="ABC-1234"
          required
          error={errors.licensePlate?.message}
          {...register('licensePlate')}
        />
        <Input
          label="VIN"
          placeholder="Optional"
          error={errors.vin?.message}
          {...register('vin')}
        />
        <Input
          label="Max Load Capacity"
          type="number"
          placeholder="5000"
          required
          error={errors.maxLoadCapacityValue?.message}
          rightAddon={
            <select
              className="bg-transparent text-xs outline-none"
              {...register('maxLoadCapacityUnit')}
            >
              <option value="kg">kg</option>
              <option value="tons">tons</option>
              <option value="lbs">lbs</option>
            </select>
          }
          {...register('maxLoadCapacityValue')}
        />
        <Input
          label="Odometer"
          type="number"
          placeholder="0"
          error={errors.odometerCurrent?.message}
          rightAddon={
            <select
              className="bg-transparent text-xs outline-none"
              {...register('odometerUnit')}
            >
              <option value="km">km</option>
              <option value="miles">mi</option>
            </select>
          }
          {...register('odometerCurrent')}
        />
        <Textarea
          label="Notes"
          placeholder="Optional notes…"
          wrapperClassName="col-span-2"
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
