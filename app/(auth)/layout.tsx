'use client';
import { SocketProvider } from '@/context/socketContext';
import { Provider } from 'react-redux';
import { store } from '@/libs/redux/store';
import "../globals.css"
import ReactQueryProvider from '@/libs/react-query/react-query-provider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <main>{children}</main>
        </div>
  );
}