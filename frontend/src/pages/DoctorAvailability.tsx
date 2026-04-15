import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // أو أي مكتبة Toast بتستخدمها
import { Loader2, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface ScheduleItem {
  start: string;
  end: string;
}

const daysOfWeek = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

export function DoctorAvailability({ doctorId }: { doctorId: string | number }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [schedule, setSchedule] = useState<Record<string, ScheduleItem>>({});

  // 1. جلب الساعات الحالية فور فتح المودال
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setFetching(true);
        // نستخدم الـ ID لجلب ساعات هذا الدكتور تحديداً
        const response = await apiRequest<any>(`/all-doctor-hours/${doctorId}`);
        
        // تحويل البيانات من Array إلى Object لسهولة التعامل بالـ State
        const formatted = response.data.reduce((acc: any, curr: any) => {
          acc[curr.day_of_week] = { 
            start: curr.start_time.slice(0, 5), 
            end: curr.end_time.slice(0, 5) 
          };
          return acc;
        }, {});
        
        setSchedule(formatted);
      } catch (error) {
        toast.error("Failed to load doctor hours");
      } finally {
        setFetching(false);
      }
    };

    if (doctorId) fetchSchedule();
  }, [doctorId]);

  // 2. تحديث الـ State عند تعديل الوقت
  const handleTimeChange = (day: string, type: "start" | "end", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  // 3. الحفظ (استدعاء دالة store/updateOrCreate في الباك إند)
  const saveDaySchedule = async (day: string) => {
    const dayData = schedule[day];
    if (!dayData?.start || !dayData?.end) {
      toast.warning("Please set both start and end times");
      return;
    }

    setLoading(true);
    try {
      await apiRequest<any>(`/store-doctor-hour`, {
        method: "POST",
        body: {
          doctor_id: doctorId,
          day_of_week: day,
          start_time: dayData.start,
          end_time: dayData.end,
        }
      });
      toast.success(`Schedule for ${day} updated!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error saving schedule");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {daysOfWeek.map((day) => (
        <div key={day} className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-card/50">
          <Label className="capitalize w-28 font-semibold">{day}</Label>
          
          <div className="flex items-center gap-4">
            <div className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">Start</span>
              <Input
                type="time"
                value={schedule[day]?.start || ""}
                onChange={(e) => handleTimeChange(day, "start", e.target.value)}
                className="w-32"
              />
            </div>
            
            <div className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">End</span>
              <Input
                type="time"
                value={schedule[day]?.end || ""}
                onChange={(e) => handleTimeChange(day, "end", e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          <Button 
            variant="outline"
            size="sm" 
            onClick={() => saveDaySchedule(day)}
            disabled={loading}
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      ))}
    </div>
  );
}