import { z } from 'zod'

export const vehicleSchema = z.object({
  name: z.string().min(1, 'Vehicle name is required'),
  vehicleType: z.enum(['truck', 'van', 'bike', 'car', 'other']),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  licensePlate: z.string().min(1, 'License plate is required'),
  vin: z.string().optional(),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg']),
  maxLoadCapacityValue: z.coerce.number().positive('Capacity must be positive'),
  maxLoadCapacityUnit: z.enum(['kg', 'tons', 'lbs']).default('kg'),
  odometerCurrent: z.coerce.number().min(0).default(0),
  odometerUnit: z.enum(['km', 'miles']).default('km'),
  status: z
    .enum(['available', 'on_trip', 'in_shop', 'out_of_service', 'retired'])
    .default('available'),
  region: z.string().optional(),
  notes: z.string().optional(),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>
