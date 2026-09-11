"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberCombobox } from "@/components/shared/member-combobox";
import { assignUserToDepartment } from "@/lib/actions/admin-actions";
import { toast } from "sonner";
import { UserMinus, UserPlus } from "lucide-react";

interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

interface DepartmentRosterProps {
  departmentId: string;
  members: MemberItem[];
}

export function DepartmentRoster({ departmentId, members }: DepartmentRosterProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please search and select a member to assign.");
      return;
    }

    setLoading(true);
    try {
      const result = await assignUserToDepartment(selectedUserId, departmentId);
      if (result.success) {
        toast.success("Member added to department");
        setSelectedUserId("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add member");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(userId: string, name: string) {
    setLoading(true);
    try {
      const result = await assignUserToDepartment(userId, null);
      if (result.success) {
        toast.success(`${name} removed from department`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove member");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add member form */}
      <form onSubmit={handleAddMember} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <MemberCombobox
            name="newMemberId"
            onSelect={(member) => setSelectedUserId(member ? member.id : "")}
            placeholder="Search member to add to department..."
          />
        </div>
        <Button type="submit" disabled={loading || !selectedUserId} className="shrink-0">
          <UserPlus className="mr-1.5 size-4" />
          Assign Member
        </Button>
      </form>

      {/* Current roster table */}
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No members currently assigned to this department.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.firstName} {m.lastName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.email}
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.phone || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleRemoveMember(m.id, `${m.firstName} ${m.lastName}`)}
                      className="text-xs text-destructive hover:bg-destructive/10"
                    >
                      <UserMinus className="mr-1 size-3.5" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
