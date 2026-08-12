import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await axios.put("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onSuccess: (updatedUser) => {
      // Update currentUser cache
      queryClient.setQueryData(["currentUser"], updatedUser);
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to update profile");
    },
  });
};
