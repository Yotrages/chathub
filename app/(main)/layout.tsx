'use client';
import Header from '@/components/layout/Header';
import { useEffect } from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  return (
    <div 
      className="flex flex-col bg-gray-50 overflow-hidden"
      // style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <div className="flex-shrink-0 z-50">
        <Header />
      </div>
      
      <main className="flex-1 overflow-hidden min-h-0">
        {children}
      </main>
    </div>
  );
}