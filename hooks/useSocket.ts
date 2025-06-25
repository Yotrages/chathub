import { useEffect, useState } from 'react';
import { socketManager } from '@/libs/socket/socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socket = socketManager.getSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    setIsConnected(socket.connected);
    
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);
  
  return { socket, isConnected };
}
