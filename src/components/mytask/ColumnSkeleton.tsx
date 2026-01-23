export function ColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-[320px] flex flex-col bg-app-card rounded-lg border opacity-60 animate-pulse">
      {/* Column Header Skeleton */}
      <div className="px-3 py-2.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-5 w-6 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 p-3">
        <div className="text-center py-8">
          <div className="h-3 w-24 bg-gray-100 rounded mx-auto" />
        </div>
      </div>

      {/* Add Task Button Skeleton */}
      <div className="p-3 pt-0">
        <div className="h-8 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
