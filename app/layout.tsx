'use client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState, AppDispatch } from '@/libs/redux/store';
import { SocketProvider } from '@/context/socketContext';
import ReactQueryProvider from '@/libs/react-query/react-query-provider';
import { ThemeProvider } from '@/context/ThemeContext';
import "./globals.css";
import toast, { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/context/NotificationContext';
import { getCookie } from 'cookies-next';
import NotificationPopup from '@/components/notification/NotificationPopUp';
import { useEffect} from 'react';
import { useSocket } from "@/context/socketContext"
import { updateUserOnlineStatus } from '@/libs/redux/authSlice';
import { api } from '@/libs/axios/config';
import { Analytics } from "@vercel/analytics/next"

function NotificationWrapper({ children }: { children: React.ReactNode }) {
  const { user} = useSelector((state: RootState) => state.auth);
  const token = getCookie("auth-token")
  const { socket, isConnected } = useSocket()
  const dispatch: AppDispatch = useDispatch()

  useEffect(() => {
    if (!user || !token || !socket || !isConnected) return;

    // Send initial online status
    socket.emit('user_online');
    socket.on('online_success', () => {
      dispatch(updateUserOnlineStatus(true));
      toast.success('You are now connected');
    });

    // Send heartbeats every 30 seconds
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
      api.post(
        '/auth/online-status',
        { status: 'heartbeat', device: navigator.userAgent },
      ).catch((err) => console.error('HTTP heartbeat error:', err));
    }, 120000);

    // Handle network changes
    const handleOnline = () => {
      socket.emit('user_online');
      api.post(
        '/auth/online-status',
        { status: 'online', device: navigator.userAgent },
      ).catch((err) => console.error('HTTP online error:', err));
      dispatch(updateUserOnlineStatus(true));
      toast.success('You are now connected');
    };

    const handleOffline = () => {
      socket.emit('user_offline');
      api.post(
        '/auth/online-status',
        { status: 'offline', device: navigator.userAgent },
      ).catch((err: any) => console.error('HTTP offline error:', err));
      dispatch(updateUserOnlineStatus(false));
      toast.error('You are not connected to the internet');
    };

    // Handle browser close
    const handleBeforeUnload = () => {
      socket.emit('user_offline');
      api.post(
        '/auth/online-status',
        { status: 'offline', device: navigator.userAgent },
      ).catch(() => {}); // Synchronous XHR is deprecated, so errors are ignored
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Handle socket errors and reconnection
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      if (err.error === 'Authentication failed') {
        dispatch(updateUserOnlineStatus(false));
        toast.error('Session expired. Please log in again.');
      }
    });

    socket.on('connect', () => {
      socket.emit('user_online');
    });

    return () => {
      clearInterval(heartbeatInterval);
      socket.off('online_success');
      socket.off('offline_success');
      socket.off('error');
      socket.off('connect');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, token, socket, isConnected, dispatch]);
  
  // Always render NotificationProvider, but pass null values when user/token don't exist
  return (
    <NotificationProvider userId={user?._id || null} token={token || null}>
      {children}
      {user && token && <NotificationPopup />}
    </NotificationProvider>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html suppressHydrationWarning>
      <body>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider defaultTheme="system" storageKey="chathub-theme">
              <ReactQueryProvider>
                <SocketProvider>
                  <NotificationWrapper>
                    {/* Dark mode aware Toaster */}
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        className: '',
                        style: {
                          background: 'var(--toast-bg)',
                          color: 'var(--toast-color)',
                          border: '1px solid var(--toast-border)',
                        },
                        success: {
                          iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                          },
                        },
                        error: {
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                          },
                        },
                      }}
                    />
                    <Analytics />
                    <div className="min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                      <main>
                        {children}
                      </main>
                    </div>
                  </NotificationWrapper>
                </SocketProvider>
              </ReactQueryProvider>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}