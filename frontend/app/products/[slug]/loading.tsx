import { Skeleton } from "@/components/ui";

export default function ProductLoading() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-6 py-10 sm:px-8 lg:px-12">
      <span className="sr-only" role="status">
        Cargando
      </span>
      <Skeleton className="h-4 w-48" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-square w-full rounded-panel" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="size-20 rounded-card" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full rounded-field" />
          <Skeleton className="h-12 w-full rounded-field" />
        </div>
      </div>
    </main>
  );
}
