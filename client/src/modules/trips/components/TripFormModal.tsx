import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { tripService } from '../tripService'
import { vehicleService, driverService } from '@/services'
import { tripSchema, type TripFormValues } from '@/schemas'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'
import type { Trip } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  trip?: Trip
}

export function TripFormModal({ isOpen, onClose, trip }: Props) {
  const qc = useQueryClient()
  const isEditMode = !!trip

  const { data: availableVehicles } = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: () => vehicleService.getAvailable(),
    enabled: isOpen,
  })

  const { data: availableDrivers } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: async () => {
      const result = await driverService.getAll({ limit: 1000 })
      return result.drivers
    },
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
  })

  const selectedVehicleId = watch('vehicleId')
  const selectedVehicle = availableVehicles?.find((v) => v._id === selectedVehicleId)
  const cargoWeight = watch('cargoWeight')

  const capacityExceeded =
    selectedVehicle &&
    cargoWeight !== undefined &&
    Number(cargoWeight) > selectedVehicle.maxLoadCapacity.value

  useEffect(() => {
    if (!isOpen) {
      reset()
    } else if (trip) {
      // Populate form with trip data for editing
      // Handle vehicleId and driverId which can be either strings or populated objects
      const vehicleId = typeof trip.vehicleId === 'string' ? trip.vehicleId : trip.vehicleId._id
      const driverId = typeof trip.driverId === 'string' ? trip.driverId : trip.driverId._id
      
      // Format datetime strings for datetime-local input (YYYY-MM-DDTHH:mm)
      const formatDateTimeLocal = (dateStr?: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }
      
      reset({
        vehicleId,
        driverId,
        originAddress: trip.origin.address,
        originName: trip.origin.name || '',
        originCity: trip.origin.city || '',
        destinationAddress: trip.destination.address,
        destinationName: trip.destination.name || '',
        destinationCity: trip.destination.city || '',
        plannedDepartureTime: formatDateTimeLocal(trip.schedule?.plannedDepartureTime),
        plannedArrivalTime: formatDateTimeLocal(trip.schedule?.plannedArrivalTime),
        cargoDescription: trip.cargo?.description || '',
        cargoWeight: trip.cargo?.weight?.value || undefined,
        cargoWeightUnit: trip.cargo?.weight?.unit || 'kg',
        cargoQuantity: trip.cargo?.quantity || undefined,
        cargoType: trip.cargo?.type || '',
        distancePlanned: trip.distance?.planned || undefined,
        distanceUnit: trip.distance?.unit || 'km',
        notes: trip.notes || '',
      })
    }
  }, [isOpen, trip, reset])

  const mutation = useMutation({
    mutationFn: async (values: TripFormValues) => {
      const payload: Record<string, unknown> = {
        vehicleId: values.vehicleId,
        driverId: values.driverId,
        origin: {
          address: values.originAddress,
          name: values.originName || undefined,
          city: values.originCity || undefined,
        },
        destination: {
          address: values.destinationAddress,
          name: values.destinationName || undefined,
          city: values.destinationCity || undefined,
        },
        schedule: {
          plannedDepartureTime: values.plannedDepartureTime,
          plannedArrivalTime: values.plannedArrivalTime || undefined,
        },
        notes: values.notes || undefined,
      }
      if (values.cargoWeight) {
        payload.cargo = {
          weight: { value: values.cargoWeight, unit: values.cargoWeightUnit },
          description: values.cargoDescription || undefined,
          quantity: values.cargoQuantity || undefined,
          type: values.cargoType || undefined,
        }
      }
      if (values.distancePlanned) {
        payload.distance = { planned: values.distancePlanned, unit: values.distanceUnit }
      }
      return isEditMode ? tripService.update(trip!._id, payload) : tripService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Trip updated successfully' : 'Trip created successfully')
      qc.invalidateQueries({ queryKey: ['trips'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const vehicleOptions =
    availableVehicles?.map((v) => ({
      value: v._id,
      label: `${v.name} (${v.licensePlate}) — ${v.maxLoadCapacity.value}${v.maxLoadCapacity.unit}`,
    })) ?? []

  const driverOptions =
    availableDrivers?.map((d) => ({
      value: d._id,
      label: `${d.firstName} ${d.lastName}`,
    })) ?? []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Trip' : 'Create New Trip'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={isSubmitting || mutation.isPending}
            disabled={!!capacityExceeded}
            onClick={handleSubmit((v) => mutation.mutate(v))}
          >
            {isEditMode ? 'Update Trip' : 'Create Trip'}
          </Button>
        </div>
      }
    >
      <form className="grid grid-cols-2 gap-3">
        <Select
          label="Vehicle"
          placeholder="Select available vehicle"
          options={vehicleOptions}
          required
          error={errors.vehicleId?.message}
          {...register('vehicleId')}
        />
        <Select
          label="Driver"
          placeholder="Select available driver"
          options={driverOptions}
          required
          error={errors.driverId?.message}
          {...register('driverId')}
        />
        <Input
          label="Origin Address"
          placeholder="123 Warehouse St, City"
          required
          error={errors.originAddress?.message}
          wrapperClassName="col-span-2"
          {...register('originAddress')}
        />
        <Input
          label="Destination Address"
          placeholder="456 Delivery Ave, City"
          required
          error={errors.destinationAddress?.message}
          wrapperClassName="col-span-2"
          {...register('destinationAddress')}
        />
        <Input
          label="Scheduled Departure"
          type="datetime-local"
          required
          error={errors.plannedDepartureTime?.message}
          {...register('plannedDepartureTime')}
        />
        <Input
          label="Estimated Arrival"
          type="datetime-local"
          error={errors.plannedArrivalTime?.message}
          {...register('plannedArrivalTime')}
        />
        <div className="col-span-2 border-t border-slate-100 pt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Cargo Details
          </p>
        </div>
        <Input
          label="Cargo Description"
          placeholder="e.g. Electronics, Pallets"
          error={errors.cargoDescription?.message}
          {...register('cargoDescription')}
        />
        <Input
          label="Cargo Weight"
          type="number"
          placeholder="0"
          rightAddon={
            <select
              className="bg-transparent text-xs outline-none"
              {...register('cargoWeightUnit')}
            >
              <option value="kg">kg</option>
              <option value="tons">tons</option>
              <option value="lbs">lbs</option>
            </select>
          }
          error={
            capacityExceeded
              ? `Exceeds vehicle capacity (${selectedVehicle?.maxLoadCapacity.value}${selectedVehicle?.maxLoadCapacity.unit})`
              : errors.cargoWeight?.message
          }
          {...register('cargoWeight')}
        />
        <Input
          label="Distance"
          type="number"
          placeholder="0"
          rightAddon={
            <select
              className="bg-transparent text-xs outline-none"
              {...register('distanceUnit')}
            >
              <option value="km">km</option>
              <option value="miles">mi</option>
            </select>
          }
          {...register('distancePlanned')}
        />
        <Textarea
          label="Notes"
          placeholder="Special instructions…"
          wrapperClassName="col-span-2"
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
