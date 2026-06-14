import { Skeleton } from "@/components/ui";

export default function TrackingLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-8 lg:px-12">
      <span className="sr-only" role="status">
        Cargando
      </span>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-panel" />
      </div>
    </main>
  );
}
