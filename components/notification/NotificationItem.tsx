'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, Reply, AtSign, Hash, X, Bell } from 'lucide-react';
import { Notification } from '@/types/index';
import { useNotifications } from '@/context/NotificationContext';
import { UserAvatar } from '../constant/UserAvatar';

interface NotificationItemProps {
  notification: Notification;
  onNavigate?: (url: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onNavigate }) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'like_post':
      case 'like_reel':
      case 'like_comment':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'reply':
        return <Reply className="w-5 h-5 text-purple-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-yellow-500" />;
      case 'tag':
        return <Hash className="w-5 h-5 text-indigo-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    if (notification.actionUrl && onNavigate) {
      onNavigate(notification.actionUrl);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification._id);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors relative group ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <UserAvatar avatar={notification.senderId.avatar} username={notification.senderId.username} className='w-10 h-10 rounded-full object-cover'/>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <span className="font-medium">{notification.senderId.username}</span>{' '}
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Icon and Actions */}
            <div className="flex items-center space-x-2 ml-2">
              {getNotificationIcon(notification.type)}
              
              {/* Unread indicator */}
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}

              {/* Delete button */}
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-opacity"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
