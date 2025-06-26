import { deleteCookie } from "cookies-next";
import { errorNotification } from "./notification";

export type ErrorType = {
  response?: {
    data?: { data?: {}; message: any; error?: {} | string[]; errors?: {} };
    status: number;
  };
  message: string;
};
export const errorMessageHandler = (obj: ErrorType) => {
  if (obj.response) {
    if (obj.response.status === 401) {
      deleteCookie("auth-token");
      return (location.href = "/");
    }
    if (obj.response.status === 500) {
      if (
        obj.response?.data?.errors &&
        typeof obj.response?.data?.errors === "string"
      )
        return errorNotification(obj?.response?.data?.errors);
      return errorNotification(obj?.response?.data?.message);
    }
    if (obj.response.status === 404) {
      return errorNotification(
        "Page not found, Please contact the site administrator"
      );
    }
    const data = obj?.response?.data?.data;
    const errors = obj?.response?.data?.errors;
    const message = obj?.response?.data?.message;
    if (errors && Array.isArray(errors)) {
      errors.forEach((item) => {
        Object.entries(item).forEach(([k, v]) => {
          errorNotification(`${k.replaceAll("_", " ")}: ${v}`);
        });
      });
    } else if (errors && typeof errors === "string") {
      errorNotification(errors);
    } else if (data && !message) {
      if (typeof data === "object")
        Object.entries(data)?.map((item: any[]) => {
          if (item[1].length > 1) {
            item[1].forEach((el: string) => errorNotification(el));
          } else {
            errorNotification(item[1]);
          }
        });
    } else if (obj?.response?.data?.error) {
      if (
        typeof obj.response.data.error === "string" &&
        obj.response.data.message
      ) {
        return errorNotification(String(obj.response.data.message));
      }
      if (typeof obj.response.data.error === "string") {
        return errorNotification(obj.response.data.error);
      }
      if (Array.isArray(obj.response.data.error))
        return errorNotification(String(obj.response.data.error));
      Object.entries(obj.response.data.error).map((item: any[]) => {
        if (item[1].length > 1) {
          item[1].forEach((el: any) => {
            if (typeof el === "string") {
              errorNotification(el);
            } else if (typeof el === "object") {
              Object.entries(el).map((item: any[]) => {
                errorNotification(item[1]);
              });
            }
          });
        } else {
          errorNotification(item[1]);
        }
      });
    } else if (errors) {
      if (typeof errors === "object") {
        Object.entries(errors)?.forEach(([_, v]) => {
          if (typeof v === "string") errorNotification(v);
          else if (Array.isArray(v)) {
            v?.forEach((el) => {
              if (typeof el === "string") {
                errorNotification(el);
              } else if (typeof el === "object" && !Array.isArray(el)) {
                Object.entries(el).forEach(([key, val]) => {
                  if (key === "message") {
                    if (typeof val === "string") {
                      errorNotification(val);
                    }
                  }
                });
              }
            });
          }
        });
      }
      if (typeof errors === "string") errorNotification(errors);
    } else if (obj?.response.data?.message) {
      if (typeof message === "string") {
        errorNotification(message);
      }
    }
  } else errorNotification(obj.message);
};
