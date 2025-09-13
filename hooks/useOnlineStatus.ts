import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

export const useOnlineStatus = () => {
  const [isUserOnline, setIsUserOnline] = useState(navigator.onLine);
  const { socket } = useSocket();

  useEffect(() => {
    const handleOnline = () => {
      setIsUserOnline(true);
      if (socket) {
        socket.emit('user_online');
      }
    };

    const handleOffline = () => {
      setIsUserOnline(false);
      if (socket) {
        socket.emit('user_offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket]);

  return { isUserOnline };
};