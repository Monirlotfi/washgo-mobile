import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehicles';

export const VEHICLES_KEY = ['vehicles'];

export function useVehicles() {
  return useQuery({
    queryKey: VEHICLES_KEY,
    queryFn: vehiclesApi.list,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}