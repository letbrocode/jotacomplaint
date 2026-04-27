import { Skeleton } from "~/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Skeleton className="h-[380px] lg:col-span-4 rounded-xl" />
        <Skeleton className="h-[380px] lg:col-span-3 rounded-xl" />
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
    </div>
  );
}
