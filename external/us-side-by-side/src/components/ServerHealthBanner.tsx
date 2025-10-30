import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useApiHealth } from "@/hooks/useApiHealth";

export const ServerHealthBanner = () => {
  const { data, error, isLoading, isError } = useApiHealth();

  const unhealthy = isError || (!isLoading && data && data.status !== "ok");

  if (!unhealthy) {
    return null;
  }

  const message =
    (isError && error instanceof Error && error.message) ||
    data?.message ||
    "We're having trouble connecting to the backend.";

  return (
    <div
      className={cn(
        "bg-destructive/10 border-b border-destructive px-4 py-2 text-sm text-destructive",
        "flex items-center justify-center gap-2 text-center",
      )}
      role="status"
    >
      <AlertCircle className="h-4 w-4" aria-hidden />
      <span>{message}</span>
    </div>
  );
};
