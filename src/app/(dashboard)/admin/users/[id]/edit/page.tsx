import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUserById } from "@/lib/data/users";
import { UserEditForm } from "./user-edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getUserById(id);
  return {
    title: user ? `Edit ${user.firstName} ${user.lastName}` : "Edit User",
  };
}

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  const [user, departments] = await Promise.all([
    getUserById(id),
    prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/admin/users/${user.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to User Details
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Member Profile</CardTitle>
          <CardDescription>
            Update personal details, membership timeline, and department affiliation for {user.firstName} {user.lastName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserEditForm user={user} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
