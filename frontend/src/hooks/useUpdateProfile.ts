import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/services/users";
import { toast } from "sonner"; 
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] }); 
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "حدث خطأ أثناء التحديث");
    },
  });
}