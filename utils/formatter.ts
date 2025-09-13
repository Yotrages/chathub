import { api } from "@/libs/axios/config";
import { updateUserOnlineStatus } from "@/libs/redux/authSlice";
import { AppDispatch } from "@/libs/redux/store";
import axios from "axios";
import { setCookie } from "cookies-next";
import { useDispatch } from "react-redux";

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

export const formatRelativeTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInWeeks === 1) return '1 week ago';
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  if (diffInMonths === 1) return '1 month ago';
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  if (diffInYears === 1) return '1 year ago';
  return `${diffInYears}y ago`;
};

export const refreshAuthToken = async (currentToken: string): Promise<string> => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      const newToken = response.data.token;
      setCookie('auth-token', newToken, {maxAge: 24 * 60 * 55}); // 24-hour expiration
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Token refresh failed');
    }
  };

  export const setUserOnlineStatus = async(status: string) => {
    const dispatch: AppDispatch = useDispatch()
    const res = await api.post("/auth/online-status", {status})
    const data = res.data.status
    const online = status === "online" ? true : false
    dispatch(updateUserOnlineStatus(online))
  }