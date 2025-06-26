import axios from "axios";
import { getCookie } from "cookies-next";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  // timeout: 10000,
  headers: {

  },
});

export const loginApi = axios.create({
  baseURL,
  // timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = axios.create({

  baseURL,
  headers: {
    "getAccept" : "true",
    "Authorization" : "true"
  }
})

api.interceptors.request.use(
  (config) => {
    const token = getCookie("auth-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    // handleLogout(error);
    return Promise.reject(error);
  }
);
