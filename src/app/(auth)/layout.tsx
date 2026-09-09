export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg mb-3">S</div>
          <h1 className="text-2xl font-bold tracking-tight">SmartCRM</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered relationship management</p>
        </div>
        {children}
      </div>
    </div>
  );
}
