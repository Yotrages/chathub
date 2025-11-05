import axios from "axios";
import { getCookie } from "cookies-next";
import { store } from "../redux/store";
import { logout } from "../redux/authSlice";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

class RateLimitManager {
  private isRateLimited: boolean = false;
  private rateLimitEndTime: number | null = null;
  private readonly LOCKOUT_DURATION = 2 * 60 * 1000; 

  setRateLimited(): void {
    this.isRateLimited = true;
    this.rateLimitEndTime = Date.now() + this.LOCKOUT_DURATION;
    
    setTimeout(() => {
      this.reset();
    }, this.LOCKOUT_DURATION);
  }

  reset(): void {
    this.isRateLimited = false;
    this.rateLimitEndTime = null;
  }

  isBlocked(): boolean {
    if (!this.isRateLimited || !this.rateLimitEndTime) {
      return false;
    }

    if (Date.now() >= this.rateLimitEndTime) {
      this.reset();
      return false;
    }

    return true;
  }

  getTimeRemaining(): number {
    if (!this.rateLimitEndTime) return 0;
    const remaining = this.rateLimitEndTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
  }
}

const rateLimitManager = new RateLimitManager();

export const api = axios.create({
  baseURL,
  headers: {},
});

export const loginApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = axios.create({
  baseURL,
  headers: {
    "getAccept": "true",
    "Authorization": "true"
  }
});

const requestInterceptor = (config: any) => {
  if (rateLimitManager.isBlocked()) {
    const timeRemaining = rateLimitManager.getTimeRemaining();
    const error: any = new Error(
      `Rate limit exceeded. Please wait ${timeRemaining} seconds before trying again.`
    );
    error.isRateLimitBlock = true;
    error.timeRemaining = timeRemaining;
    error.config = config;
    return Promise.reject(error);
  }

  const token = getCookie("auth-token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const responseInterceptor = (response: any) => response;

const errorInterceptor = (error: any) => {
  if (error.response?.status === 429) {
    rateLimitManager.setRateLimited();
    
    if (typeof window !== 'undefined') {
      console.warn('Rate limit exceeded. All requests blocked for 2 minutes.');
      
      // You can dispatch a Redux action or show a toast notification here
      // Example: store.dispatch(showNotification({ 
      //   type: 'error', 
      //   message: 'Too many requests. Please wait 2 minutes.' 
      // }));
    }
  }

  if (error.response?.status === 401) {
    const previousLocation = window.location.pathname;
    store.dispatch(logout());
    window.location.href = `/login?from=${encodeURIComponent(previousLocation)}&error=${encodeURIComponent('session expired, login again')}`;
  }

  return Promise.reject(error);
};

[api, loginApi, authApi].forEach(instance => {
  instance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
  instance.interceptors.response.use(responseInterceptor, errorInterceptor);
});

export const getRateLimitStatus = () => ({
  isBlocked: rateLimitManager.isBlocked(),
  timeRemaining: rateLimitManager.getTimeRemaining(),
});

export const resetRateLimit = () => {
  rateLimitManager.reset();
};