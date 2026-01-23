export function BoardSkeleton() {
  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
      <div className="flex gap-4 h-full">
        {/* Skeleton Columns */}
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="flex-shrink-0 w-[320px] flex flex-col bg-app-card rounded-lg border"
          >
            {/* Column Header Skeleton */}
            <div className="px-3 py-2.5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-6 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Tasks Skeleton */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {[1, 2, 3].map((task) => (
                <div
                  key={task}
                  className="bg-app-card border rounded px-2.5 py-2 space-y-2"
                >
                  {/* Title */}
                  <div className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse mt-0.5" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>

                  {/* Description */}
                  {task !== 3 && (
                    <div className="ml-5">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between ml-5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center -space-x-2">
                      <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse border border-white" />
                      <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse border border-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task Button Skeleton */}
            <div className="p-3 pt-0">
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
