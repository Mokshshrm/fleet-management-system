import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { fuelService, vehicleService, driverService } from '@/services'
import { fuelLogSchema, type FuelLogFormValues } from '@/schemas'
import type { FuelLog } from '@/types'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'

interface Props {
  isOpen: boolean
  log?: FuelLog
  onClose: () => void
}

const fuelTypeOptions = [
  { value: '', label: 'Not specified' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'cng', label: 'CNG' },
  { value: 'lpg', label: 'LPG' },
]

export function FuelLogFormModal({ isOpen, log, onClose }: Props) {
  const qc = useQueryClient()
  const isEditing = !!log

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-all'],
    queryFn: () => vehicleService.getAll({ limit: 200 }),
    enabled: isOpen,
    select: (d) => d.vehicles.map((v) => ({ value: v._id, label: `${v.licensePlate} — ${v.make} ${v.model}` })),
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers-all'],
    queryFn: () => driverService.getAll({ limit: 200 }),
    enabled: isOpen,
    select: (d) => d.drivers.map((dr) => ({ value: dr._id, label: `${dr.firstName} ${dr.lastName}` })),
  })

  const vehicleOptions = [{ value: '', label: 'Select vehicle' }, ...(vehicles ?? [])]
  const driverOptions = [{ value: '', label: 'No driver' }, ...(drivers ?? [])]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      odometerUnit: 'km',
      quantityUnit: 'liters',
      costCurrency: 'USD',
      isFull: true,
      date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (log) {
        reset({
          vehicleId: typeof log.vehicleId === 'object' ? (log.vehicleId as any)._id : log.vehicleId,
          driverId: log.driverId ? (typeof log.driverId === 'object' ? (log.driverId as any)._id : log.driverId) : '',
          date: log.date?.split('T')[0] ?? '',
          fuelType: log.fuelType as any,
          odometerValue: log.odometer?.value ?? 0,
          odometerUnit: (log.odometer?.unit as 'km' | 'miles') ?? 'km',
          quantityValue: log.quantity?.value ?? 0,
          quantityUnit: (log.quantity?.unit as 'liters' | 'gallons' | 'kwh') ?? 'liters',
          costPricePerUnit: log.cost?.pricePerUnit ?? 0,
          costCurrency: log.cost?.currency ?? 'USD',
          stationName: log.station?.name ?? '',
          stationBrand: log.station?.brand ?? '',
          locationAddress: log.location?.address ?? '',
          locationCity: log.location?.city ?? '',
          isFull: log.isFull ?? true,
          paymentMethod: log.paymentMethod as any,
          receiptNumber: log.receiptNumber ?? '',
          notes: log.notes ?? '',
        })
      } else {
        reset({
          odometerUnit: 'km', quantityUnit: 'liters', costCurrency: 'USD',
          isFull: true, date: new Date().toISOString().split('T')[0],
        })
      }
    }
  }, [isOpen, log, reset])

  const mutation = useMutation({
    mutationFn: (values: FuelLogFormValues) => {
      const payload = {
        vehicleId: values.vehicleId,
        driverId: values.driverId || undefined,
        date: values.date,
        fuelType: values.fuelType,
        odometer: { value: values.odometerValue, unit: values.odometerUnit },
        quantity: { value: values.quantityValue, unit: values.quantityUnit },
        cost: {
          pricePerUnit: values.costPricePerUnit,
          total: values.quantityValue * values.costPricePerUnit,
          currency: values.costCurrency,
        },
        station:
          values.stationName
            ? { name: values.stationName, brand: values.stationBrand || undefined }
            : undefined,
        location:
          values.locationAddress
            ? { address: values.locationAddress, city: values.locationCity || undefined }
            : undefined,
        isFull: values.isFull,
        paymentMethod: values.paymentMethod || undefined,
        receiptNumber: values.receiptNumber || undefined,
        notes: values.notes || undefined,
      }
      return isEditing ? fuelService.update(log!._id, payload) : fuelService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Fuel log updated' : 'Fuel log added')
      qc.invalidateQueries({ queryKey: ['fuel'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Fuel Log' : 'Log Fuel Fill-up'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={handleSubmit((v) => mutation.mutate(v))}>
            {isEditing ? 'Save Changes' : 'Save Log'}
          </Button>
        </div>
      }
    >
      <form className="grid grid-cols-2 gap-4">
        <Select
          label="Vehicle"
          options={vehicleOptions}
          {...register('vehicleId')}
          error={errors.vehicleId?.message}
        />
        <Select
          label="Driver (optional)"
          options={driverOptions}
          {...register('driverId')}
          error={errors.driverId?.message}
        />
        <Input
          label="Date"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />
        <Select
          label="Fuel Type"
          options={fuelTypeOptions}
          {...register('fuelType')}
          error={errors.fuelType?.message}
        />
        <Input
          label="Odometer Reading"
          type="number"
          step="0.1"
          leftAddon={<span className="text-xs text-slate-500">km</span>}
          {...register('odometerValue')}
          error={errors.odometerValue?.message}
        />
        <Input
          label="Quantity"
          type="number"
          step="0.01"
          leftAddon={<span className="text-xs text-slate-500">L</span>}
          {...register('quantityValue')}
          error={errors.quantityValue?.message}
        />
        <Input
          label="Price Per Unit"
          type="number"
          step="0.001"
          leftAddon={<span className="text-xs text-slate-500">$/L</span>}
          {...register('costPricePerUnit')}
          error={errors.costPricePerUnit?.message}
        />
        <Input
          label="Station Name"
          {...register('stationName')}
          error={errors.stationName?.message}
        />
        <div className="col-span-2">
          <Input
            label="Location Address (optional)"
            {...register('locationAddress')}
            error={errors.locationAddress?.message}
          />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isFull" {...register('isFull')} className="rounded border-slate-300" />
          <label htmlFor="isFull" className="text-sm text-slate-600">Full tank fill-up</label>
        </div>
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
