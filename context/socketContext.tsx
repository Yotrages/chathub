"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { getCookie } from "cookies-next";
import { refreshAuthToken } from "@/utils/formatter";
import { useRouter } from "next/navigation";
import { logout } from "@/libs/redux/authSlice";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  onlineUsers: string[];
  forceReconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  onlineUsers: [],
  forceReconnect: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();

  const userId = useSelector((state: RootState) => state.auth.user?._id);
  
  const socketRef = useRef<Socket | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const userIdRef = useRef(userId);
  const hasHandledAuthError = useRef(false);

  // 🔥 FIXED: Prevent unnecessary re-renders from Redux
  // Only update ref, don't cause re-render
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // 🔥 FIXED: Use useCallback with empty deps to prevent recreation
  const startHeartbeat = useCallback((sock: Socket) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = setInterval(() => {
      if (sock && sock.connected) {
        sock.emit('heartbeat');
      }
    }, 25000);
  }, []); // Empty deps - function never changes

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []); // Empty deps

  const forceReconnect = useCallback(() => {
    const sock = socketRef.current;
    if (sock) {
      console.log("🔄 Forcing socket reconnection...");
      stopHeartbeat();
      sock.disconnect();
      
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect();
        }
      }, 500);
    }
  }, []); // Empty deps - uses ref

  // 🔥 FIXED: Main socket initialization - only runs ONCE
  useEffect(() => {
    const token = getCookie("auth-token");
    const currentUserId = userIdRef.current;

    if (isInitializedRef.current) {
      console.log("⏸️ Socket already initialized");
      return;
    }

    if (!currentUserId || !token) {
      console.log("⏸️ No user/token, skipping socket");
      return;
    }

    isInitializedRef.current = true;
    hasHandledAuthError.current = false;
    console.log("🚀 Initializing socket for user:", currentUserId);

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    const newSocket = io(socketUrl, {
      auth: {
        token: String(token), 
        userId: currentUserId,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    // 🔥 FIXED: Event handlers use refs and batched state updates
    newSocket.on("connect", () => {
      console.log("✅ Socket connected");
      
      // Batch state updates
      setIsConnected(true);
      setConnectionError(null);
      hasHandledAuthError.current = false;

      startHeartbeat(newSocket);

      const activeUserId = userIdRef.current;
      if (activeUserId) {
        newSocket.emit('user_online', { userId: activeUserId });
        newSocket.emit('connection_confirmed');
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket error:", error.message);
      
      // 🔥 FIXED: Don't update state on every error to prevent re-renders
      // Only update if state actually changed
      setIsConnected(prev => {
        if (prev === true) {
          console.log("Updating isConnected to false");
          return false;
        }
        return prev;
      });
      
      setConnectionError(prev => {
        if (prev !== error.message) {
          return error.message;
        }
        return prev;
      });
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log("🔄 Reconnect attempt", attemptNumber);
      // Don't update state on every attempt to prevent re-renders
    });

    newSocket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      setConnectionError("Failed to reconnect. Please refresh.");
    });

    newSocket.on("reconnect", async (attemptNumber) => {
      console.log("✅ Reconnected after", attemptNumber, "attempts");
      
      setIsConnected(true);
      setConnectionError(null);
      hasHandledAuthError.current = false;

      startHeartbeat(newSocket);

      try {
        const currentToken = getCookie("auth-token") as string;
        const activeUserId = userIdRef.current;
        
        if (currentToken && activeUserId) {
          const refreshedToken = await refreshAuthToken(currentToken);
          newSocket.auth = { token: refreshedToken, userId: activeUserId };
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }

      const activeUserId = userIdRef.current;
      if (activeUserId) {
        newSocket.emit('user_online', { userId: activeUserId });
        newSocket.emit('connection_confirmed');
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected:", reason);
      setIsConnected(false);
      stopHeartbeat();

      if (reason !== "io client disconnect") {
        setConnectionError(`Disconnected: ${reason}`);
      }

      if (reason === "ping timeout" || 
          reason === "transport close" ||
          reason === "transport error") {
        console.log("Attempting reconnect...");
        setTimeout(() => {
          if (newSocket && !newSocket.connected) {
            newSocket.connect();
          }
        }, 1000);
      }
    });

    newSocket.on("connection_confirmed", (data) => {
      setIsConnected(true);
      console.log("✅ Connection confirmed:", data);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket");
      isInitializedRef.current = false;
      hasHandledAuthError.current = false;
      stopHeartbeat();
      
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      if (socketRef.current) {
        const activeUserId = userIdRef.current;
        if (activeUserId) {
          socketRef.current.emit('user_offline', { userId: activeUserId });
        }
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setOnlineUsers([]);
    };
  }, []); // 🔥 EMPTY DEPS - only runs once!

  // 🔥 FIXED: Handle user logout separately
  useEffect(() => {
    if (!userId && socketRef.current) {
      console.log("User logged out, disconnecting");
      socketRef.current.disconnect();
      isInitializedRef.current = false;
    }
  }, [userId]);

  // 🔥 FIXED: Auth error handling with proper guards
  useEffect(() => {
    if (!socket) return;

    const handleTokenExpired = () => {
      if (hasHandledAuthError.current) {
        console.log("⏸️ Already handled auth error");
        return;
      }
      
      hasHandledAuthError.current = true;
      console.log("🔐 Token expired");
      stopHeartbeat();
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      dispatch(logout());
      router.push(
        `/login?error=${encodeURIComponent(
          "Your session has expired. Please login again."
        )}`
      );
    };

    const handleAuthenticationError = (error: any) => {
      if (hasHandledAuthError.current) {
        console.log("⏸️ Already handled auth error");
        return;
      }

      console.error("❌ Auth error:", error);
      
      if (
        error?.code === "AUTH_ERROR" ||
        error?.message === "TOKEN_EXPIRED" ||
        error?.message === "NO_TOKEN" ||
        error?.message === "INVALID_TOKEN" ||
        error?.message === "Authentication failed"
      ) {
        hasHandledAuthError.current = true;
        stopHeartbeat();
        
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        dispatch(logout());
        router.push(
          `/login?error=${encodeURIComponent(
            "Authentication failed. Please login again."
          )}`
        );
      } else {
        console.log("⚠️ Non-auth error, will retry:", error?.message);
      }
    };

    socket.on("token_expired", handleTokenExpired);
    socket.on("authentication_error", handleAuthenticationError);

    return () => {
      socket.off("token_expired", handleTokenExpired);
      socket.off("authentication_error", handleAuthenticationError);
    };
  }, [socket, dispatch, router, stopHeartbeat]);

  // 🔥 FIXED: Memoize context value properly
  const contextValue = useMemo(
    () => ({
      socket,
      isConnected,
      connectionError,
      onlineUsers,
      forceReconnect,
    }),
    [socket, isConnected, connectionError, onlineUsers, forceReconnect]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};