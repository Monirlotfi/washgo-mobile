import { useMutation } from '@tanstack/react-query';
import { userApi } from '../api/user';
import { useAuthStore } from '../stores/auth.store';

export function useUpdateProfile() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: async (updatedUser) => {
      if (token) {
        await setAuth(updatedUser, token);
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: userApi.changePassword,
  });
}