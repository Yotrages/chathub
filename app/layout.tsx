// app/(main)/layout.tsx
'use client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/libs/redux/store';
import { SocketProvider } from '@/context/socketContext';
import ReactQueryProvider from '@/libs/react-query/react-query-provider';
import Footer from '@/components/layout/Footer';
import "./globals.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ReactQueryProvider>
              <SocketProvider>
                <div className="min-h-screen bg-gray-50">
                  <main>{children}</main>
                  <Footer />
                </div>
              </SocketProvider>
            </ReactQueryProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}