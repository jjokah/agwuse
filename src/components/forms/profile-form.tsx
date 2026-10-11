"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from "@/lib/actions/user-actions";
import { ImageUpload } from "@/components/shared/image-upload";
import { avatarFilenamePrefix } from "@/lib/uploads/policy";
import { toast } from "sonner";

interface ProfileFormProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    occupation: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    maritalStatus: string | null;
    directoryShowEmail: boolean;
    directoryShowPhone: boolean;
    image?: string | null;
    profilePhoto?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success("Profile updated successfully");
        router.refresh();
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void handleSubmit(new FormData(event.currentTarget)); }} aria-busy={loading} className="space-y-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <ImageUpload
          name="image"
          defaultValue={user.image || user.profilePhoto}
          folder="avatars"
          label="Upload Profile Photo"
          aspectRatio="square"
          pathPrefix={avatarFilenamePrefix(user.id)}
          allowUrlInput={false}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={user.firstName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={user.lastName}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} disabled />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={user.phone || ""}
            placeholder="08012345678"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            name="occupation"
            defaultValue={user.occupation || ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={
              user.dateOfBirth
                ? user.dateOfBirth.toISOString().split("T")[0]
                : ""
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select name="gender" defaultValue={user.gender || "none"}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select name="maritalStatus" defaultValue={user.maritalStatus || "none"}>
            <SelectTrigger id="maritalStatus">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="SINGLE">Single</SelectItem>
              <SelectItem value="MARRIED">Married</SelectItem>
              <SelectItem value="WIDOWED">Widowed</SelectItem>
              <SelectItem value="DIVORCED">Divorced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          defaultValue={user.address || ""}
          placeholder="Your address"
        />
      </div>

      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="text-sm font-semibold">Member directory privacy</legend>
        <p className="text-xs text-muted-foreground">Your name and department are visible to members. Choose which contact details to share. Church administrators and finance staff retain access for their work.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="directoryShowEmail" defaultChecked={user.directoryShowEmail} /> Show my email in the member directory</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="directoryShowPhone" defaultChecked={user.directoryShowPhone} /> Show my phone in the member directory</label>
      </fieldset>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
