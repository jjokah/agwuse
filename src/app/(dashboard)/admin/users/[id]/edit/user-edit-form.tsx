"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUser } from "@/lib/actions/admin-actions";
import { toast } from "sonner";
import type { User, Department } from "@prisma/client";

interface UserEditFormProps {
  user: User;
  departments: Pick<Department, "id" | "name">[];
}

export function UserEditForm({ user, departments }: UserEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState<string>(user.gender || "none");
  const [maritalStatus, setMaritalStatus] = useState<string>(
    user.maritalStatus || "none"
  );
  const [departmentId, setDepartmentId] = useState<string>(
    user.departmentId || "none"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("gender", gender === "none" ? "" : gender);
    formData.set("maritalStatus", maritalStatus === "none" ? "" : maritalStatus);
    formData.set("departmentId", departmentId === "none" ? "" : departmentId);

    try {
      const result = await updateUser(user.id, formData);
      if (result.success) {
        toast.success("User profile updated successfully");
        router.push(`/admin/users/${user.id}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch {
      toast.error("An unexpected error occurred while saving profile");
    } finally {
      setLoading(false);
    }
  }

  const dobStr = user.dateOfBirth
    ? new Date(user.dateOfBirth).toISOString().split("T")[0]
    : "";
  const memberSinceStr = user.memberSince
    ? new Date(user.memberSince).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={user.firstName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={user.lastName}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={user.phone || ""}
            placeholder="e.g. 0803 123 4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            name="occupation"
            defaultValue={user.occupation || ""}
            placeholder="e.g. Civil Servant, Engineer"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={gender} onValueChange={(val) => setGender(val || "none")}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Marital Status</Label>
          <Select value={maritalStatus} onValueChange={(val) => setMaritalStatus(val || "none")}>
            <SelectTrigger>
              <SelectValue placeholder="Select marital status" />
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

        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={departmentId} onValueChange={(val) => setDepartmentId(val || "none")}>
            <SelectTrigger>
              <SelectValue placeholder="Assign department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Department</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={dobStr}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="memberSince">Member Since</Label>
          <Input
            id="memberSince"
            name="memberSince"
            type="date"
            defaultValue={memberSinceStr}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Residential Address</Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={user.address || ""}
          placeholder="Enter residential address"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
