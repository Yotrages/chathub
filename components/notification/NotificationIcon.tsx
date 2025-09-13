"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

interface NotificationIconProps {
  onClick: () => void;
  className?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({
  onClick,
  className = "",
}) => {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className={`relative rounded-full transition-colors ${className}`}
    >
      <Bell size={18} className="text-gray-600" />
      <p className="text-xs text-gray-600 hidden md:flex truncate mt-1 whitespace-nowrap">
        Notifications
      </p>
      {unreadCount > 0 && (
        <span className="absolute -top-[6px] -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationIcon;
