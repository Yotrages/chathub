"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
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

  const { user } = useSelector((state: RootState) => state.auth);
  const token = getCookie("auth-token");

  const socketRef = useRef<Socket | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const startHeartbeat = useCallback((sock: Socket) => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = setInterval(() => {
      if (sock && sock.connected) {
        sock.emit('heartbeat');
      }
    }, 25000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  const forceReconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("🔄 Forcing socket reconnection...");
      stopHeartbeat();
      socketRef.current.disconnect();
      
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.connect();
        }
      }, 500);
    }
  }, [stopHeartbeat]);

  useEffect(() => {
    if (isInitializedRef.current) {
      console.log("Socket already initialized, skipping...");
      return;
    }

    if (!user?._id || !token) {
      console.log("No user or token, skipping socket connection");
      return;
    }

    isInitializedRef.current = true;
    console.log("🚀 Initializing socket connection for user:", user._id);

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
       
    console.log('🔌 Creating socket connection:', {
      url: socketUrl,
      hasToken: !!token,
      userId: user._id,
    });

    const newSocket = io(socketUrl, {
      auth: {
        token: String(token), 
        userId: user._id,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      // pingTimeout: 120000, 
      // pingInterval: 25000, 
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to socket server");
      console.log("Socket ID:", newSocket.id);
      console.log("Transport:", newSocket.io.engine.transport.name);
      
      setIsConnected(true);
      setConnectionError(null);

      startHeartbeat(newSocket);

      newSocket.emit('user_online', { userId: user._id });
      
      newSocket.emit('connection_confirmed');
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log("🔄 Reconnection attempt", attemptNumber);
      setConnectionError(`Reconnecting... (attempt ${attemptNumber})`);
    });

    newSocket.on("reconnect", async (attemptNumber) => {
      console.log("✅ Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);

      startHeartbeat(newSocket);

      try {
        const currentToken = getCookie("auth-token") as string;
        if (currentToken) {
          const refreshedToken = await refreshAuthToken(currentToken);
          newSocket.auth = { token: refreshedToken, userId: user._id };
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }

      newSocket.emit('user_online', { userId: user._id });
      newSocket.emit('connection_confirmed');
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected. Reason:", reason);
      setIsConnected(false);
      stopHeartbeat();

      if (reason !== "io client disconnect") {
        setConnectionError(`Disconnected: ${reason}`);
      }

      if (reason === "io server disconnect" || 
          reason === "ping timeout" || 
          reason === "transport close" ||
          reason === "transport error") {
        console.log("Attempting to reconnect...");
        setTimeout(() => {
          if (newSocket && !newSocket.connected) {
            newSocket.connect();
          }
        }, 1000);
      }
    });

    newSocket.io.engine.on("upgrade", (transport) => {
      console.log("🚀 Transport upgraded to:", transport.name);
    });

    newSocket.on("connection_confirmed", (data) => {
      setIsConnected(true)
      console.log("✅ Connection confirmed by server:", data);
    });

    newSocket.io.engine.on("ping", () => {
      console.log("🏓 Ping sent");
    });

    newSocket.io.engine.on("pong", () => {
      console.log("🏓 Pong received");
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection");
      isInitializedRef.current = false;
      stopHeartbeat();
      
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      if (socketRef.current) {
        socketRef.current.emit('user_offline', { userId: user._id });
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setOnlineUsers([]);
    };
  }, []); 

  useEffect(() => {
    if (!socket) return;

    const handleTokenExpired = () => {
      console.log("🔐 Socket token expired");
      stopHeartbeat();
      dispatch(logout());
      socket.disconnect();

      router.push(
        `/login?error=${encodeURIComponent(
          "Your session has expired. Please login again."
        )}`
      );
    };

    const handleAuthError = (error: Error) => {
      console.error("❌ Socket auth error:", error.message);

      if (
        error.message === "TOKEN_EXPIRED" ||
        error.message === "NO_TOKEN" ||
        error.message === "INVALID_TOKEN"
      ) {
        stopHeartbeat();
        dispatch(logout());
        router.push(
          `/login?error=${encodeURIComponent(
            "Authentication failed. Please login again."
          )}`
        );
      }
    };

    socket.on("token_expired", handleTokenExpired);
    socket.on("connect_error", handleAuthError);

    return () => {
      socket.off("token_expired", handleTokenExpired);
      socket.off("connect_error", handleAuthError);
    };
  }, [socket, dispatch, router, stopHeartbeat]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionError,
        onlineUsers,
        forceReconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};