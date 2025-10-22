"use client";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor, RootState, AppDispatch } from "@/libs/redux/store";
import { SocketProvider } from "@/context/socketContext";
import ReactQueryProvider from "@/libs/react-query/react-query-provider";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";
import toast, { Toaster } from "react-hot-toast";
import { NotificationProvider } from "@/context/NotificationContext";
import { getCookie } from "cookies-next";
import NotificationPopup from "@/components/notification/NotificationPopUp";
import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/context/socketContext";
import { updateUserOnlineStatus } from "@/libs/redux/authSlice";
import { api } from "@/libs/axios/config";
import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import { ChunkErrorBoundary } from "@/components/layout/ChunckErrorBoundary";

function NotificationWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const token = getCookie("auth-token");
  const { socket, isConnected } = useSocket();
  const dispatch: AppDispatch = useDispatch();
  const pathname = usePathname();
  const [retryCount, setRetryCount] = useState(0);
  const lastErrorTime = useRef<number>(0);
  const isReloading = useRef<boolean>(false);
  const MAX_RETRIES = 3;
  const ERROR_THROTTLE_TIME = 5000;

  useEffect(() => {
    const isDev = 
      process.env.NODE_ENV === 'development' || 
      process.env.NODE_ENV !== 'production' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '3000';

    if (isDev) {
      console.log('🛑 Error handler DISABLED (Development Mode)');
      return; 
    }

    console.log('✅ Error handler ENABLED (Production Mode)');
    
    let reloadTimeout: NodeJS.Timeout;

    const handleError = (event: ErrorEvent) => {
      const isChunkError = 
        event.message?.includes("Loading chunk") ||
        event.message?.includes("ChunkLoadError") ||
        event.message?.includes("Failed to fetch dynamically imported module") ||
        event.message?.includes("error loading dynamically imported module");

      if (!isChunkError) return;

      event.preventDefault();
      
      const now = Date.now();
      if (now - lastErrorTime.current < ERROR_THROTTLE_TIME) {
        console.log("⏸️ Chunk error throttled");
        return;
      }
      lastErrorTime.current = now;

      if (isReloading.current) {
        console.log("⏸️ Already reloading");
        return;
      }

      console.warn("🔄 Production chunk error:", event.message);
      
      if (retryCount >= MAX_RETRIES) {
        console.error("❌ Max retries reached");
        toast.error("Failed to load page. Please refresh your browser.", {
          duration: 10000,
          id: 'chunk-error-max-retry',
        });
        return;
      }

      console.log(`🔄 Recovery attempt ${retryCount + 1}/${MAX_RETRIES}`);
      setRetryCount(prev => prev + 1);
      isReloading.current = true;
      
      toast.loading("Refreshing page...", {
        duration: 1500,
        id: 'chunk-error-reload',
      });

      if ('caches' in window) {
        caches.keys().then(names => {
          Promise.all(names.map(name => caches.delete(name)))
            .then(() => console.log("✅ Cache cleared"))
            .catch(err => console.error("Cache error:", err));
        });
      }

      reloadTimeout = setTimeout(() => {
        console.log("🔄 Reloading...");
        window.location.href = pathname;
      }, 1500);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || event.reason?.toString() || '';
      const isChunkError = 
        errorMsg.includes("Loading chunk") ||
        errorMsg.includes("ChunkLoadError") ||
        errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("dynamically imported module");

      if (!isChunkError) return;

      event.preventDefault();
      console.warn("🔄 Unhandled chunk error:", errorMsg);
      
      const syntheticEvent = new ErrorEvent('error', { 
        message: errorMsg,
        error: event.reason 
      });
      handleError(syntheticEvent);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      if (reloadTimeout) clearTimeout(reloadTimeout);
    };
  }, [pathname, retryCount]);

  useEffect(() => {
    setRetryCount(0);
    isReloading.current = false;
    lastErrorTime.current = 0;
  }, [pathname]);

  useEffect(() => {
    if (!user || !token || !socket || !isConnected) return;

    console.log("🔌 Socket connection for:", user.username);

    socket.emit("user_online");
    
    socket.on("online_success", () => {
      dispatch(updateUserOnlineStatus(true));
    });

    const heartbeatInterval = setInterval(() => {
      socket.emit("heartbeat");
      api
        .post("/auth/online-status", {
          status: "heartbeat",
          device: navigator.userAgent,
        })
        .catch((err) => console.error("❌ Heartbeat error:", err));
    }, 120000);

    const handleOnline = () => {
      console.log("User online");
      socket.emit("user_online");
      api
        .post("/auth/online-status", {
          status: "online",
          device: navigator.userAgent,
        })
        .catch((err) => console.error("❌ Online error:", err));
      dispatch(updateUserOnlineStatus(true));
      toast.success("Connected", { duration: 2000 });
    };

    const handleOffline = () => {
      console.log("User offline");
      socket.emit("user_offline");
      api
        .post("/auth/online-status", {
          status: "offline",
          device: navigator.userAgent,
        })
        .catch((err: any) => console.error("❌ Offline error:", err));
      dispatch(updateUserOnlineStatus(false));
      toast.error("No internet connection", { duration: 5000 });
    };

    const handleBeforeUnload = () => {
      socket.emit("user_offline");
      api
        .post("/auth/online-status", {
          status: "offline",
          device: navigator.userAgent,
        })
        .catch(() => {});
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeunload", handleBeforeUnload);

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      if (err.error === "Authentication failed") {
        dispatch(updateUserOnlineStatus(false));
      }
    });

    socket.on("connect", () => {
      console.log("Socket reconnected");
      socket.emit("user_online");
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return () => {
      console.log("🧹 Cleanup socket");
      clearInterval(heartbeatInterval);
      socket.off("online_success");
      socket.off("offline_success");
      socket.off("error");
      socket.off("connect");
      socket.off("disconnect");
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, token, socket, isConnected, dispatch]);

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
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <ChunkErrorBoundary>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <ThemeProvider defaultTheme="light" storageKey="chathub-theme">
                <ReactQueryProvider>
                  <SocketProvider>
                    <NotificationWrapper>
                      <Toaster
                        position="top-right"
                        toastOptions={{
                          className: "",
                          style: {
                            background: "var(--toast-bg)",
                            color: "var(--toast-color)",
                            border: "1px solid var(--toast-border)",
                          },
                          success: {
                            iconTheme: {
                              primary: "#10b981",
                              secondary: "#fff",
                            },
                          },
                          error: {
                            iconTheme: {
                              primary: "#ef4444",
                              secondary: "#fff",
                            },
                          },
                        }}
                      />
                      <Analytics />
                      <div className="min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                        <main>{children}</main>
                      </div>
                    </NotificationWrapper>
                  </SocketProvider>
                </ReactQueryProvider>
              </ThemeProvider>
            </PersistGate>
          </Provider>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}