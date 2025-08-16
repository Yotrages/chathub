"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { getCookie, setCookie } from 'cookies-next';
import axios from 'axios'; // Ensure axios is installed: npm install axios
import { refreshAuthToken } from '@/utils/formatter';

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
    throw new Error('useSocket must be used within a SocketProvider');
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
  const { user } = useSelector((state: RootState) => state.auth);
  const token = getCookie('auth-token');
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const forceReconnect = () => {
    if (socket) {
      console.log('Forcing socket reconnection...');
      socket.disconnect();
      socket.connect();
    }
  };

   

  useEffect(() => {
    if (!user || !token) {
      console.log('No user or token, skipping socket connection');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token: token, userId: user.id },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket server, Socket ID:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      setConnectionError(error.message);
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionError('Connection failed after multiple attempts. Please refresh the page.');
      }
    });

    newSocket.on('reconnect', async (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      try {
        const refreshedToken = await refreshAuthToken(token as string);
        newSocket.auth = { token: refreshedToken, userId: user.id };
      } catch (error) {
        console.error('Reconnect token refresh failed:', error);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from socket server. Reason:', reason);
      setIsConnected(false);
    });

    newSocket.on('messages_read', (data) => console.log('Messages read:', data));
    newSocket.on('new_message', (data) => console.log('New message:', data));

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setOnlineUsers([]);
    };
  }, [user?.id, token]);

  useEffect(() => {
    console.log('Socket Provider State:', {
      hasSocket: !!socket,
      isConnected,
      connectionError,
      onlineUsersCount: onlineUsers.length,
      userId: user?.id,
      hasToken: !!token,
    });
  }, [socket, isConnected, connectionError, onlineUsers.length, user?.id, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError, onlineUsers, forceReconnect }}>
      {children}
    </SocketContext.Provider>
  );
};