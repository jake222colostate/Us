import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchProfile, updateProfile, uploadAvatar } from "@/lib/api/endpoints";
import type { ProfileDetails } from "@/lib/api/types";

export const useProfileData = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 60_000,
  });

  const update = useMutation({
    mutationFn: (payload: Partial<ProfileDetails>) => updateProfile(payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile"], updatedProfile);
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile"], updatedProfile);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
    update,
    upload,
  };
};
