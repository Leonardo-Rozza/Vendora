import { Skeleton } from "@/components/ui";

export default function RootLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
      <span className="sr-only" role="status">
        Cargando
      </span>
      <Skeleton className="h-44 w-full rounded-panel" />
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
