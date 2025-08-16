'use client';
import Header from '@/components/layout/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <div className="bg-gray-50">
            <Header />
          <main>{children}</main>
        </div>
  );
}