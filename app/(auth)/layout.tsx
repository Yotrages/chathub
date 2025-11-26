'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <div className="min-h-screen flex items-center justify-center w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <main className="w-full">{children}</main>
        </div>
  );
}