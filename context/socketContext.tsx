"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
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

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const socketRef = useRef<Socket | null>(null);
  const isInitializing = useRef(false);

  const userIdRef = useRef(user?._id);
  const tokenRef = useRef(token);

  // Update refs when values change
  useEffect(() => {
    userIdRef.current = user?._id;
    tokenRef.current = token;
  }, [user?._id, token]);

  const forceReconnect = () => {
    if (socketRef.current) {
      console.log("Forcing socket reconnection...");
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  useEffect(() => {
    if (isInitializing.current || socketRef.current) {
      console.log("Socket already exists or initializing, skipping...");
      return;
    }

    if (!user?._id || !token) {
      console.log("No user or token, skipping socket connection");
      return;
    }

    isInitializing.current = true;
    console.log("Initializing socket connection for user:", user._id);

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    const newSocket = io(socketUrl, {
      auth: {
        token: token,
        userId: user._id,
      },
      transports: ["websocket", "polling"], 
      timeout: 20000,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      forceNew: false, 
      upgrade: true, 
      rememberUpgrade: true, 
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server, Socket ID:", newSocket.id);
      console.log("Transport:", newSocket.io.engine.transport.name);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      isInitializing.current = false;
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
      setConnectionError(error.message);
      reconnectAttempts.current++;

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionError(
          "Connection failed after multiple attempts. Please refresh the page."
        );
        isInitializing.current = false;
      }
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt", attemptNumber);
    });

    newSocket.on("reconnect", async (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      try {
        const currentToken = getCookie("auth-token") as string;
        if (currentToken) {
          const refreshedToken = await refreshAuthToken(currentToken);
          newSocket.auth = { token: refreshedToken, userId: userIdRef.current };
        }
      } catch (error) {
        console.error("Reconnect token refresh failed:", error);
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from socket server. Reason:", reason);
      setIsConnected(false);

      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket.io.engine.on("upgrade", (transport) => {
      console.log("Transport upgraded to:", transport.name);
    });

    newSocket.on("messages_read", (data) =>
      console.log("Messages read:", data)
    );
    newSocket.on("new_message", (data) => console.log("New message:", data));

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setOnlineUsers([]);
      isInitializing.current = false;
    };
  }, [user?._id, token]);

  useEffect(() => {
    console.log("Socket Provider State:", {
      hasSocket: !!socket,
      isConnected,
      connectionError,
      onlineUsersCount: onlineUsers.length,
      userId: user?._id,
      hasToken: !!token,
      transport: socket?.io?.engine?.transport?.name,
    });
  }, [
    socket,
    isConnected,
    connectionError,
    onlineUsers.length,
    user?._id,
    token,
  ]);

  useEffect(() => {
    if (!socket) return;

    socket.on("token_expired", () => {
      console.log("Socket token expired");
      dispatch(logout());

      socket.disconnect();

      router.push(
        `/login?error=${encodeURIComponent(
          "Your session has expired. Please login again."
        )}`
      );
    });

    socket.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error.message);

      if (
        error.message === "TOKEN_EXPIRED" ||
        error.message === "NO_TOKEN" ||
        error.message === "INVALID_TOKEN"
      ) {
        dispatch(logout());
        router.push(
          `/login?error=${encodeURIComponent(
            "Authentication failed. Please login again."
          )}`
        );
      }
    });

    return () => {
      socket.off("token_expired");
      socket.off("connect_error");
    };
  }, [socket, dispatch, router]);

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
