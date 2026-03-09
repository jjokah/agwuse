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
import { createDepartment, updateDepartment } from "@/lib/actions/content-actions";
import { toast } from "sonner";

interface DepartmentFormProps {
  department?: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    leaderId: string | null;
  };
  members: { id: string; firstName: string; lastName: string }[];
}

const CATEGORIES = [
  { value: "MINISTRY", label: "Ministry" },
  { value: "COMMITTEE", label: "Committee" },
  { value: "CHOIR", label: "Choir" },
  { value: "OUTREACH", label: "Outreach" },
];

export function DepartmentForm({ department, members }: DepartmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = department
        ? await updateDepartment(department.id, formData)
        : await createDepartment(formData);
      if (result.success) {
        toast.success(department ? "Department updated" : "Department created");
        router.push("/admin/settings/departments");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Department Name</Label>
        <Input id="name" name="name" required defaultValue={department?.name || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select name="category" defaultValue={department?.category || "MINISTRY"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leaderId">Department Leader (optional)</Label>
        <Select name="leaderId" defaultValue={department?.leaderId || ""}>
          <SelectTrigger>
            <SelectValue placeholder="Select leader" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={department?.description || ""}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : department ? "Update Department" : "Create Department"}
      </Button>
    </form>
  );
}
