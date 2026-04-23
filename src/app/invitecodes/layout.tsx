export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Invite Code Generator</h1>
          <p className="text-muted-foreground">Generate invite codes for new users</p>
        </div>
        {children}
      </div>
    </div>
  );
}
