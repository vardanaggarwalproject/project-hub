export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
        {/* Abstract background decorative elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
            {children}
        </div>
      </div>
    )
  }
