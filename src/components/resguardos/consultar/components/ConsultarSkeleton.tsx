/**
 * ConsultarSkeleton - Loading skeleton for Consultar Resguardos page
 * 
 * Provides a skeleton UI that matches the layout of the main page
 * while data is being loaded.
 */

interface ConsultarSkeletonProps {
  isDarkMode: boolean;
}

export default function ConsultarSkeleton({ isDarkMode }: ConsultarSkeletonProps) {
  return (
    <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <div className="h-full overflow-y-auto p-4 md:p-8">
        <div className="w-full max-w-[1800px] mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className={`pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <div className={`h-8 w-64 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse mb-2`} />
            <div className={`h-4 w-96 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
          </div>

          {/* Search and Filters Skeleton */}
          <div className="space-y-4">
            <div className={`h-12 w-full rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} animate-pulse`} />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className={`h-8 w-24 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} animate-pulse`}
                />
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                    }`}
                  >
                    <div className={`h-4 w-20 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse mb-2`} />
                    <div className={`h-8 w-16 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className={`rounded-lg border overflow-hidden ${
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
              }`}>
                {/* Table Header */}
                <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className={`h-4 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`}
                      />
                    ))}
                  </div>
                </div>

                {/* Table Rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                  <div 
                    key={row}
                    className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}
                  >
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((col) => (
                        <div 
                          key={col}
                          className={`h-4 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Skeleton */}
              <div className="flex justify-between items-center">
                <div className={`h-4 w-32 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className={`h-8 w-8 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Details Panel Skeleton */}
            <div className="space-y-4">
              <div className={`p-6 rounded-lg border ${
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
              }`}>
                <div className={`h-6 w-48 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse mb-4`} />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i}>
                      <div className={`h-3 w-24 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse mb-1`} />
                      <div className={`h-4 w-full rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-lg border ${
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
              }`}>
                <div className={`h-6 w-32 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse mb-4`} />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className={`h-16 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
