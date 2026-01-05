
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-md space-y-8">
            {children}
        </div>
      </div>
    )
  }
