'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <div className="min-h-screen flex items-center justify-center w-full bg-gray-50">
          <main className="w-full">{children}</main>
        </div>
  );
}