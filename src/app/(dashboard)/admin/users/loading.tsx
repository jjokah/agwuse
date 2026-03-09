import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
