'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import NotificationItem from '@/components/notification/NotificationItem';
import { Loader2, Bell, CheckCheck, Inbox } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    hasMore, 
    fetchNotifications, 
    markAllAsRead 
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications(1);
  }, [navigator.onLine]);

  const handleLoadMore = () => {
    const nextPage = Math.floor(notifications.length / 20) + 1;
    fetchNotifications(nextPage);
  };

  const handleNavigate = (url: string) => {
    router.push(url);
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-3 sm:py-6 px-2 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          {/* Top Bar */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                  </p>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl w-full xs:w-auto"
              >
                <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-1 sm:p-1.5 backdrop-blur-sm">
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>All</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                  filter === 'all' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {notifications.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                    filter === 'unread' 
                      ? 'bg-white/20 text-white animate-pulse' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800/50 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-16 gap-3 sm:gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-blue-500" />
                <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 animate-ping" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Loading notifications...
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center p-8 sm:p-16">
              <div className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6">
                <Bell className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs sm:max-w-sm mx-auto">
                {filter === 'unread' 
                  ? 'You have no unread notifications. Great job staying on top of things!' 
                  : 'When you receive notifications, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filteredNotifications.map((notification, index) => (
                <div 
                  key={notification._id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <NotificationItem
                    notification={notification}
                    onNavigate={handleNavigate}
                  />
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && filter === 'all' && (
                <div className="p-3 sm:p-4 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg sm:rounded-xl transition-all duration-200 border border-dashed border-blue-300 dark:border-blue-700 hover:border-solid active:scale-98"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Load more notifications'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        @media (max-width: 374px) {
          .xs\:flex-row {
            flex-direction: column;
          }
          .xs\:w-auto {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;