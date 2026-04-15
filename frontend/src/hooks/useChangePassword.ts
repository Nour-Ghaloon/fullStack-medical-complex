import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/services/users";
import { toast } from "sonner"; // افترضت أنك تستخدم sonner للرسائل

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success(data.message || "تم تغيير كلمة المرور بنجاح");
      // اختياري: تفريغ الحقول بعد النجاح
    },
    onError: (error: any) => {
      // لعرض أخطاء الـ Validation القادمة من Laravel
      const message = error.response?.data?.message || "حدث خطأ ما";
      toast.error(message);
    },
  });
}