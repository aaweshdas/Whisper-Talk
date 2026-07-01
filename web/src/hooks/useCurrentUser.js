import { useAuthStore } from "../lib/auth";

// Returns the currently authenticated user from the auth store.
// Matches the shape previously returned by the Clerk-based version
// so all existing consumers continue to work unchanged.
export const useCurrentUser = () => {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  return {
    data: user,
    isLoading: status === "loading",
    isSuccess: status === "authenticated",
  };
};
