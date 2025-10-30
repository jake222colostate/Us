import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchOnboarding, submitOnboardingStep } from "@/lib/api/endpoints";

export const useOnboarding = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["onboarding"],
    queryFn: fetchOnboarding,
    staleTime: 0,
  });

  const submit = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: Record<string, unknown> }) =>
      submitOnboardingStep(stepId, data),
    onSuccess: (progress) => {
      queryClient.setQueryData(["onboarding"], progress);
    },
  });

  return {
    progress: query.data,
    isLoading: query.isLoading,
    error: query.error,
    submit,
  };
};
