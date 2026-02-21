import { z } from 'zod'

export const tripSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  // origin
  originAddress: z.string().min(1, 'Origin address is required'),
  originName: z.string().optional(),
  originCity: z.string().optional(),
  originState: z.string().optional(),
  originCountry: z.string().optional(),
  // destination
  destinationAddress: z.string().min(1, 'Destination address is required'),
  destinationName: z.string().optional(),
  destinationCity: z.string().optional(),
  destinationState: z.string().optional(),
  destinationCountry: z.string().optional(),
  // schedule
  plannedDepartureTime: z.string().min(1, 'Scheduled departure is required'),
  plannedArrivalTime: z.string().optional(),
  // cargo
  cargoDescription: z.string().optional(),
  cargoWeight: z.coerce.number().min(0).optional(),
  cargoWeightUnit: z.enum(['kg', 'tons', 'lbs']).default('kg'),
  cargoQuantity: z.coerce.number().min(0).optional(),
  cargoType: z.string().optional(),
  // distance
  distancePlanned: z.coerce.number().min(0).optional(),
  distanceUnit: z.enum(['km', 'miles']).default('km'),
  // other
  notes: z.string().optional(),
})

export const cancelTripSchema = z.object({
  cancelReason: z.string().min(1, 'Cancel reason is required'),
})

export const podSchema = z.object({
  recipientName: z.string().optional(),
  notes: z.string().optional(),
})

export const rateTripSchema = z.object({
  score: z.coerce.number().min(1).max(5),
  feedback: z.string().optional(),
})

export type TripFormValues = z.infer<typeof tripSchema>
export type CancelTripFormValues = z.infer<typeof cancelTripSchema>
export type PodFormValues = z.infer<typeof podSchema>
export type RateTripFormValues = z.infer<typeof rateTripSchema>
