import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";
import { hasEntitlement, isRevenueCatEnabled } from "./revenuecatClient";

/**
 * Hook to check if user has premium access.
 * Premium is ONLY granted when RevenueCat confirms an active "premium" entitlement.
 * Never defaults to true.
 */
export function usePremium() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["premium-status"],
    queryFn: async () => {
      if (Platform.OS === "web" || !isRevenueCatEnabled()) {
        return false;
      }

      const result = await hasEntitlement("premium");
      return result.ok ? result.data : false;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
  });

  return {
    isPremium: data ?? false,
    isLoading,
    refetch,
  };
}
