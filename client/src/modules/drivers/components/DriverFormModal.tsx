import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { driverService } from '@/services'
import { driverSchema, type DriverFormValues } from '@/schemas'
import type { Driver } from '@/types'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'
import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  driver?: Driver
  onClose: () => void
}

const licenseCategoryOptions = [
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
  { value: 'bike', label: 'Bike' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'heavy', label: 'Heavy' },
]

const statusOptions = [
  { value: 'on_duty', label: 'On Duty' },
  { value: 'off_duty', label: 'Off Duty' },
  { value: 'on_trip', label: 'On Trip' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
]

export function DriverFormModal({ isOpen, driver, onClose }: Props) {
  const qc = useQueryClient()
  const isEditing = !!driver

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: { status: 'on_duty', licenseCategory: 'car' },
  })

  useEffect(() => {
    if (isOpen) {
      if (driver) {
        reset({
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email ?? '',
          phone: driver.phone,
          licenseNumber: driver.license.number,
          licenseCategory: driver.license.category?.[0] ?? 'car',
          licenseExpiryDate: driver.license.expiryDate?.split('T')[0] ?? '',
          dateOfBirth: driver.dateOfBirth?.split('T')[0] ?? '',
          status: driver.status,
          notes: driver.notes ?? '',
        })
      } else {
        reset({ status: 'on_duty', licenseCategory: 'car' })
      }
    }
  }, [isOpen, driver, reset])

  const mutation = useMutation({
    mutationFn: (values: DriverFormValues) => {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone,
        dateOfBirth: values.dateOfBirth || undefined,
        license: {
          number: values.licenseNumber,
          category: [values.licenseCategory],
          expiryDate: values.licenseExpiryDate,
        },
        status: values.status,
        employmentType: values.employmentType || undefined,
        hireDate: values.hireDate || undefined,
        notes: values.notes || undefined,
      }
      return isEditing
        ? driverService.update(driver!._id, payload)
        : driverService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Driver updated' : 'Driver added')
      qc.invalidateQueries({ queryKey: ['drivers'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Driver' : 'Add New Driver'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={mutation.isPending}
            onClick={handleSubmit((v) => mutation.mutate(v))}
          >
            {isEditing ? 'Save Changes' : 'Add Driver'}
          </Button>
        </div>
      }
    >
      <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
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
        <Input
          label="Phone"
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="Email (optional)"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="License Number"
          {...register('licenseNumber')}
          error={errors.licenseNumber?.message}
        />
        <Input
          label="License Expiry"
          type="date"
          {...register('licenseExpiryDate')}
          error={errors.licenseExpiryDate?.message}
        />
        <Select
          label="License Category"
          options={licenseCategoryOptions}
          {...register('licenseCategory')}
          error={errors.licenseCategory?.message}
        />
        <Input
          label="Date of Birth"
          type="date"
          {...register('dateOfBirth')}
          error={errors.dateOfBirth?.message}
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
            rows={3}
            {...register('notes')}
            error={errors.notes?.message}
          />
        </div>
      </form>
    </Modal>
  )
}
