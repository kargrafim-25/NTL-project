import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/trading";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check if the error is due to email verification requirement
  const isEmailVerificationRequired = error && 
    (error as any)?.response?.data?.code === "EMAIL_VERIFICATION_REQUIRED";

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isEmailVerificationRequired,
    emailVerificationError: isEmailVerificationRequired ? (error as any)?.response?.data : null,
  };
}
