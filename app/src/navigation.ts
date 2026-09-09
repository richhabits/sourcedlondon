import type { Vehicle } from './types';

export type RootStackParamList = {
  Setup: undefined;
  Vehicles: undefined;
  VehicleDetail: { vehicle: Vehicle };
  Enquire: { vehicle?: Vehicle } | undefined;
};
