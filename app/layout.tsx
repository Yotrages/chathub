"use client";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/libs/redux/store";
import { SocketProvider } from "@/context/socketContext";
import ReactQueryProvider from "@/libs/react-query/react-query-provider";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";
import toast, { Toaster } from "react-hot-toast";
import { NotificationProvider } from "@/context/NotificationContext";
import { getCookie } from "cookies-next";
import NotificationPopup from "@/components/notification/NotificationPopUp";
import { useEffect, useState } from "react";
import { useSocket } from "@/context/socketContext";
import { updateUserOnlineStatus } from "@/libs/redux/authSlice";
import { api } from "@/libs/axios/config";
import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import { ChunkErrorBoundary } from "@/components/layout/ChunckErrorBoundary";
import { CallProvider } from "@/context/CallProvider";
import { ReduxProvider } from "@/libs/redux/redux-provider";

function NotificationWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const token = getCookie("auth-token");
  const { socket, isConnected } = useSocket();
  const dispatch: AppDispatch = useDispatch();
  const pathname = usePathname();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    let reloadTimeout: NodeJS.Timeout;

    const handleError = (event: ErrorEvent) => {
      const isChunkError = 
        event.message?.includes("Loading chunk") ||
        event.message?.includes("ChunkLoadError") ||
        event.message?.includes("Failed to fetch dynamically imported module") ||
        event.message?.includes("error loading dynamically imported module");

      if (isChunkError) {
        event.preventDefault();
        console.warn("🔄 Chunk load error detected:", event.message);
        
        if (retryCount >= MAX_RETRIES) {
          console.error("❌ Max retry attempts reached. Manual refresh required.");
          toast.error("Failed to load page. Please refresh your browser.", {
            duration: 10000,
          });
          return;
        }

        console.log(`🔄 Attempting recovery (${retryCount + 1}/${MAX_RETRIES})...`);
        setRetryCount(prev => prev + 1);
        
        if ('caches' in window) {
          caches.keys().then(names => {
            Promise.all(names.map(name => caches.delete(name)))
              .then(() => {
                console.log("✅ Cache cleared");
              });
          });
        }

        reloadTimeout = setTimeout(() => {
          console.log("🔄 Reloading page...");
          window.location.href = pathname;
        }, 1500);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || event.reason?.toString() || '';
      const isChunkError = 
        errorMsg.includes("Loading chunk") ||
        errorMsg.includes("ChunkLoadError") ||
        errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("dynamically imported module");

      if (isChunkError) {
        event.preventDefault();
        console.warn("🔄 Unhandled rejection (chunk error):", errorMsg);
        
        const syntheticEvent = new ErrorEvent('error', { 
          message: errorMsg,
          error: event.reason 
        });
        handleError(syntheticEvent);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
    };
  }, [pathname, retryCount, MAX_RETRIES]);

  useEffect(() => {
    setRetryCount(0);
  }, [pathname]);

  useEffect(() => {
    if (!user || !token || !socket || !isConnected) return;

    console.log("🔌 Initializing socket connection for user:", user.username);

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
        .catch((err) => console.error("❌ HTTP heartbeat error:", err));
    }, 120000);

    const handleOnline = () => {
      console.log("User is online");
      socket.emit("user_online");
      api
        .post("/auth/online-status", {
          status: "online",
          device: navigator.userAgent,
        })
        .catch((err) => console.error("❌ HTTP online error:", err));
      dispatch(updateUserOnlineStatus(true));
      toast.success("You are now connected", { duration: 2000 });
    };

    const handleOffline = () => {
      console.log("User is offline");
      socket.emit("user_offline");
      api
        .post("/auth/online-status", {
          status: "offline",
          device: navigator.userAgent,
        })
        .catch((err: any) => console.error("❌ HTTP offline error:", err));
      dispatch(updateUserOnlineStatus(false));
      toast.error("You are not connected to the internet", { duration: 5000 });
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
      console.log("🧹 Cleaning up socket listeners");
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
      <CallProvider> 
        {children}
        {user && token && <NotificationPopup />}
      </CallProvider>
    </NotificationProvider>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        {/* Primary Meta Tags */}
        <title>ChatHub - Connect with Friends and Communities</title>
        <meta name="title" content="ChatHub - Connect with Friends and Communities" />
        <meta 
          name="description" 
          content="Join ChatHub, the social platform where you can connect with friends, share moments, and build meaningful communities. Chat, share, and discover new connections." 
        />
        <meta name="keywords" content="ChatHub, social media, social network, connect friends, online community, chat, messaging, share photos" />
        <meta name="author" content="ChatHub" />
        <meta name="robots" content="index, follow" />
        
        {/* Viewport and Mobile */}
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
        <meta name="apple-mobile-web-app-title" content="ChatHub" />
        <meta name="format-detection" content="telephone=no" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://chathub-hazel.vercel.app" />
        <meta property="og:title" content="ChatHub - Connect with Friends and Communities" />
        <meta 
          property="og:description" 
          content="Join ChatHub, the social platform where you can connect with friends, share moments, and build meaningful communities." 
        />
        <meta property="og:image" content="https://yournetizen.com/og-image.jpg" />
        <meta property="og:site_name" content="ChatHub" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://chathub-hazel.vercel.app" />
        <meta property="twitter:title" content="ChatHub - Connect with Friends and Communities" />
        <meta 
          property="twitter:description" 
          content="Join ChatHub, the social platform where you can connect with friends, share moments, and build meaningful communities." 
        />
        <meta property="twitter:image" content="https://chathub-hazel.vercel.app/twitter-image.jpg" />

        {/* Favicon */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" /> */}

        {/* Theme Color */}
        <meta name="theme-color" content="#3b82f6" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://chathub-hazel.vercel.app" />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Structured Data for SEO */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ChatHub",
              "description": "Connect with friends and communities on ChatHub",
              "url": "https://chathub-hazel.vercel.app",
              "applicationCategory": "SocialNetworkingApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body>
        <ChunkErrorBoundary>
          <ReduxProvider>
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
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                      <main>{children}</main>
                    </div>
                  </NotificationWrapper>
                </SocketProvider>
              </ReactQueryProvider>
            </ThemeProvider>
          </ReduxProvider>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}