import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Phone, MapPin, Camera } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useChangePassword } from "@/hooks/useChangePassword";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { mutate: update, isPending } = useUpdateProfile();

  const handleSave = () => {
    if (isEditing) {
      const nameInput = document.getElementById("displayName") as HTMLInputElement;
      update({ name: nameInput.value });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  // استدعاء الهوك في بداية الكومبوننت
const { mutate: updatePassword, isPending: isChangingPassword } = useChangePassword();

// دالة المعالجة عند الضغط على الزر
const handleChangePassword = () => {
  const currentpassword = (document.getElementById("currentPassword") as HTMLInputElement).value;
  const newpassword = (document.getElementById("newPassword") as HTMLInputElement).value;
  const newpassword_confirmation = (document.getElementById("confirmPassword") as HTMLInputElement).value;

  // إرسال البيانات (المفاتيح يجب أن تطابق Laravel)
  updatePassword({
    currentpassword,
    newpassword,
    newpassword_confirmation // Laravel يتوقع confirmed ليتطابق مع confirmPassword
  });
};

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {/* <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {getInitials(user?.profile?.display_name, user?.email)}
                    </AvatarFallback>
                  </Avatar> */}
                  {/* <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button> */}
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {user?.profile?.display_name || "User"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary capitalize">
                  {user?.role || "user"}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.profile?.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.profile?.address || "Not provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </div>
                {/* <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button> */}
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                  {/* <TabsTrigger value="medical">Medical Info</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger> */}
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        defaultValue={user?.profile?.display_name || ""}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email || ""}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        defaultValue={user?.profile?.phone || ""}
                        disabled={!isEditing}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  {/* <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      defaultValue={user?.profile?.address || ""}
                      disabled={!isEditing}
                      placeholder="Enter your address"
                    />
                  </div> */}
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="bloodType">Blood Type</Label>
                      <Input
                        id="bloodType"
                        disabled={!isEditing}
                        placeholder="e.g., A+"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="allergies">Known Allergies</Label>
                      <Input
                        id="allergies"
                        disabled={!isEditing}
                        placeholder="e.g., Penicillin, Peanuts"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      disabled={!isEditing}
                      placeholder="Name and phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="medicalNotes">Medical Notes</Label>
                    <Textarea
                      id="medicalNotes"
                      disabled={!isEditing}
                      placeholder="Any relevant medical history or conditions"
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="preferredDoctor">Preferred Doctor</Label>
                      <Input
                        id="preferredDoctor"
                        disabled={!isEditing}
                        placeholder="Select preferred doctor"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="preferredTime">Preferred Appointment Time</Label>
                      <Input
                        id="preferredTime"
                        disabled={!isEditing}
                        placeholder="e.g., Morning, Afternoon"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="communicationPreference">Communication Preference</Label>
                    <Input
                      id="communicationPreference"
                      disabled={!isEditing}
                      placeholder="Email, Phone, SMS"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="password" className="space-y-4">
                  <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
