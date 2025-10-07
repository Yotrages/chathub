'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

const NotificationPopup: React.FC = () => {
  const { popupNotification, hideNotificationPopup } = useNotifications();

  useEffect(() => {
    if (popupNotification) {
      // notification sound (to-do)
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {

      });
    }
  }, [popupNotification]);

  if (!popupNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <img
              src={popupNotification.senderId.avatar || ''}
              alt={popupNotification.senderId.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {popupNotification.senderId.username}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {popupNotification.message}
                </p>
              </div>
              
              <button
                onClick={hideNotificationPopup}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
