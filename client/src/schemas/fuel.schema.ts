import { z } from 'zod'

export const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(),
  tripId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg']),
  quantityValue: z.coerce.number().positive('Quantity must be positive'),
  quantityUnit: z.enum(['liters', 'gallons', 'kwh']).default('liters'),
  costPricePerUnit: z.coerce.number().positive('Price per unit is required'),
  costCurrency: z.string().default('USD'),
  odometerValue: z.coerce.number().min(0, 'Odometer reading required'),
  odometerUnit: z.enum(['km', 'miles']).default('km'),
  stationName: z.string().optional(),
  stationBrand: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  isFull: z.boolean().default(true),
  paymentMethod: z
    .enum(['cash', 'card', 'fleet_card', 'credit', 'other'])
    .optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
})

export type FuelLogFormValues = z.infer<typeof fuelLogSchema>
