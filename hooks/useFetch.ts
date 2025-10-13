import { z, ZodSchema } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosResponse } from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setUserCredentials } from "@/libs/redux/authSlice";
import { setCookie } from "cookies-next/client";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AppDispatch } from "@/libs/redux/store";
import { errorMessageHandler } from "@/libs/feedback/error-handler";
import { successNotification } from "@/libs/feedback/notification";
import { api } from "@/libs/axios/config";
import { useEffect } from "react";


// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: number;
}

export interface UseApiControllerOptions<TFormData extends Record<string, any> = Record<string, any>, TResponse = any> {
  method: HttpMethod;
  url: string;
  schema?: ZodSchema<TFormData>;
  defaultValues?: Partial<TFormData>;
  disabled?: boolean;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  redirectTo?: string;
  queryOptions?: Omit<UseQueryOptions<TResponse>, 'queryKey' | 'queryFn'>;
  isAuthEndpoint?: boolean;
}

export interface QueryResult<TResponse> {
  register: undefined;
  handleSubmit: undefined;
  errors: undefined;
  reset: undefined;
  formMethods: undefined;

  // Loading states
  isLoading: boolean;
  isPending: boolean;

  // Data
  data: TResponse | undefined;
  error: Error | null;

  // Query specific
  isSuccess: boolean;
  isError: boolean;
  refetch: () => Promise<any>;

  // Manual triggers
  trigger: (data?: Record<string, any>) => void;
  mutate: undefined;

  // Utils
  disabled: boolean;
  method: string;
  url: string;
}

export interface MutationResult<TFormData, TResponse> {
  register: any;
  handleSubmit: {
    (e?: React.FormEvent<HTMLFormElement>): Promise<void>; 
    (onSubmit: (data: TFormData) => void): (e?: React.FormEvent<HTMLFormElement>) => Promise<void>; 
  };
  errors: any;
  reset: () => void;
  formMethods: any;

  // Loading states
  isLoading: boolean;
  isPending: boolean;

  // Data
  data: TResponse | undefined;
  error: Error | null;

  // Mutation specific
  isSuccess: boolean;
  isError: boolean;
  refetch: undefined;

  // Manual triggers
  trigger: (data?: TFormData) => void;
  mutate: (data?: TFormData) => void;

  // Utils
  disabled: boolean;
  method: string;
  url: string;
}

// ==============================================================================
// MAIN API CONTROLLER HOOK WITH OVERLOADS
// ============================================================================

// Overload for GET requests
export function useApiController<TResponse = any>(
  options: UseApiControllerOptions<Record<string, any>, TResponse> & { method: "GET" }
): QueryResult<TResponse>;

// Overload for mutation requests
export function useApiController<TFormData extends Record<string, any> = Record<string, any>, TResponse = any>(
  options: UseApiControllerOptions<TFormData, TResponse> & { method: "POST" | "PUT" | "PATCH" | "DELETE" }
): MutationResult<TFormData, TResponse>;

// Implementation
export function useApiController<TFormData extends Record<string, any> = Record<string, any>, TResponse = any>(
  options: UseApiControllerOptions<TFormData, TResponse>
): QueryResult<TResponse> | MutationResult<TFormData, TResponse> {
  const {
    method,
    url,
    schema,
    defaultValues,
    disabled = false,
    onSuccess,
    onError,
    successMessage,
    redirectTo,
    queryOptions,
    isAuthEndpoint = false
  } = options;

  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();

  // ============================================================================
  // FORM SETUP (Only for POST, PUT, PATCH methods)
  // ============================================================================

  const needsForm = ['POST', 'PUT', 'PATCH'].includes(method);
  
  const formMethods = useForm<TFormData>({
    resolver: schema ? zodResolver(schema) : undefined,
    disabled,
    defaultValues: defaultValues as any,
  });

  const { register, handleSubmit: rhfHandleSubmit, formState: { errors }, reset } = formMethods;

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

const makeApiCall = async (data?: TFormData): Promise<TResponse> => {
  let response: AxiosResponse<TResponse>;
  
  console.log('API Call Data:', data);
  
  const hasFiles = data && Object.values(data).some(value => 
    value instanceof File || 
    (Array.isArray(value) && value.some(item => item instanceof File))
  );
  
  try {
    let requestData = data;
    let headers = {};
    
    if (hasFiles) {
      const formData = new FormData();
      
      Object.entries(data as Record<string, any>).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
          console.log(`Appended single file: ${key}`, value.name);
        } else if (Array.isArray(value) && value.length > 0) {
          if (value[0] instanceof File) {
            value.forEach((file) => {
              if (file instanceof File) {
                formData.append(key, file); 
                console.log(`✅ Appended file: ${key} ->`, file.name, `(${file.size} bytes)`);
              }
            });
          } else {
            formData.append(key, JSON.stringify(value));
          }
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
          console.log(`Appended regular field: ${key} = ${value}`);
        }
      });
      
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      requestData = formData as any;
      headers = {};
    } else {
      headers = { 'Content-Type': 'application/json' };
    }

    switch (method) {
      case "GET":
        response = await api.get<TResponse>(url, { params: data });
        break;
      case "POST":
        response = await api.post<TResponse>(url, requestData, { headers });
        break;
      case "PUT":
        response = await api.put<TResponse>(url, requestData, { headers });
        break;
      case "PATCH":
        response = await api.patch<TResponse>(url, requestData, { headers });
        break;
      case "DELETE":
        response = await api.delete<TResponse>(url, { params: data });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    console.log('Response:', response.data);
    return response.data as TResponse;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

  // ============================================================================
  // SUCCESS/ERROR HANDLERS
  // ============================================================================

  const handleSuccess = (data: TResponse) => {
    if (needsForm) {
      reset();
    }

    console.log('Handling success for', url)
    if (isAuthEndpoint && data) {
      const authData = data as any;
      console.log(authData) 
      dispatch(setUserCredentials({
        user: authData.user,
      }));
      setCookie("auth-token", authData.token);
    }

    if (successMessage) {
      successNotification(successMessage);
    }

    if (onSuccess) {
      onSuccess(data);
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  const handleError = (error: any) => {
    console.error('API Error:', error);
    errorMessageHandler(error);
    if (onError) {
      onError(error);
    }
  };

  // ============================================================================
  // QUERY (for GET requests)
  // ============================================================================

  const queryResult = useQuery<TResponse>({
    queryKey: [url, method],
    queryFn: () => makeApiCall(),
    enabled: method === "GET" && !disabled,
    ...queryOptions,
  });

  // Handle onSuccess and onError for queries
  useEffect(() => {
    if (queryResult.isSuccess && onSuccess) {
      onSuccess(queryResult.data);
    }
  }, [queryResult.isSuccess, queryResult.data]);

  useEffect(() => {
    if (queryResult.isError && onError) {
      onError(queryResult.error);
    }
  }, [queryResult.isError, queryResult.error]);

  // ============================================================================
  // MUTATION (for POST, PUT, PATCH, DELETE)
  // ============================================================================

  const mutation = useMutation<TResponse, Error, TFormData | undefined>({
    mutationFn: makeApiCall,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // ============================================================================
  // SUBMIT HANDLERS
  // ============================================================================

  const defaultOnSubmit = (data: TFormData) => {
    console.log('Default Form Submit Data:', data);
    mutation.mutate(data);
  };

  const handleSubmit = ((customOnSubmitOrEvent?: ((data: TFormData) => void) | React.FormEvent<HTMLFormElement>) => {
    if (customOnSubmitOrEvent && 'preventDefault' in customOnSubmitOrEvent) {
      const e = customOnSubmitOrEvent as React.FormEvent<HTMLFormElement>;
      e.preventDefault();
      return rhfHandleSubmit(defaultOnSubmit)(e);
    }
    
    const submitHandler = (customOnSubmitOrEvent as (data: TFormData) => void) || defaultOnSubmit;
    
    return (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      return rhfHandleSubmit(submitHandler)(e);
    };
  }) as {
    (e?: React.FormEvent<HTMLFormElement>): Promise<void>;
    (onSubmit: (data: TFormData) => void): (e?: React.FormEvent<HTMLFormElement>) => Promise<void>;
  };

  const trigger = (data?: TFormData) => {
    if (method === "GET") {
      queryResult.refetch();
    } else {
      mutation.mutate(data);
    }
  };

  // ============================================================================
  // RETURN VALUES WITH PROPER TYPING
  // ============================================================================

  // For GET requests
  if (method === "GET") {
    return {
      register: undefined,
      handleSubmit: undefined,
      errors: undefined,
      reset: undefined,
      formMethods: undefined,

      // Loading states
      isLoading: queryResult.isLoading,
      isPending: queryResult.isPending,

      // Data with proper typing
      data: queryResult.data as TResponse | undefined,
      error: queryResult.error,

      // Query specific
      isSuccess: queryResult.isSuccess,
      isError: queryResult.isError,
      refetch: queryResult.refetch,

      // Manual triggers
      trigger,
      mutate: undefined,

      // Utils
      disabled,
      method,
      url,
    } as QueryResult<TResponse>;
  }

  return {
    register,
    handleSubmit,
    errors,
    reset,
    formMethods,

    // Loading states
    isLoading: mutation.isPending,
    isPending: mutation.isPending,

    // Data with proper typing
    data: mutation.data as TResponse | undefined,
    error: mutation.error,

    // Mutation specific
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    refetch: undefined,

    // Manual triggers
    trigger,
    mutate: mutation.mutate,

    // Utils
    disabled,
    method,
    url,
  } as MutationResult<TFormData, TResponse>;
};

// ============================================================================
// SPECIALIZED HOOKS FOR COMMON PATTERNS
// ============================================================================

// Auth types
interface LoginData extends Record<string, any> {
  email: string;
  password: string;
}

interface AuthResponse {
   message: string;
  token: string;
  user: {
    email: string;
  password: string;
  avatar: string;
  username: string;
  };
}

// Auth Login Hook
export const useLogin = (from?: string, options?: Partial<Omit<UseApiControllerOptions<LoginData, AuthResponse>, 'method'>>): MutationResult<LoginData, AuthResponse> => {
  const loginSchema = z.object({
    email: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });

  return useApiController<LoginData, AuthResponse>({
    method: "POST",
    url: "auth/login",
    schema: loginSchema,
    isAuthEndpoint: true,
    successMessage: "Login successful!",
        onSuccess: (data) => {
      console.log('Login onSuccess called with:', data);
    },
    onError: (error) => {
      console.error('Login onError called with:', error);
    },
    redirectTo: from ? `${from === '/' ? "/" : `/${from}`}` : "/",
    ...options,
  } as UseApiControllerOptions<LoginData, AuthResponse> & { method: "POST" });
};

interface RegisterData extends Record<string, any> {
  email: string;
  password: string;
  avatar: File | string;
  username: string;
}

interface RegisterResponse {
  message: string;
  token: string;
  user: {
    email: string;
  password: string;
  avatar: string;
  username: string;
  };
}

// Auth Register Hook
export const useRegister = (options?: Partial<Omit<UseApiControllerOptions<RegisterData, RegisterResponse>, 'method'>>): MutationResult<RegisterData, RegisterResponse> => {
  const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    avatar: z.union([
      z.instanceof(File),
      z.string()
    ]).optional().or(z.literal("")),
    username: z.string().min(1, "Username is required"),
  });

  return useApiController<RegisterData, RegisterResponse>({
    method: "POST",
    url: "auth/register",
    schema: registerSchema,
    successMessage: "Registration successful!",
    redirectTo: "/login",
    ...options,
  } as UseApiControllerOptions<RegisterData, RegisterResponse> & { method: "POST" });
};

// Generic Data Fetcher with proper typing
export const useFetch = <TResponse = any>(
  url: string, 
  options?: Partial<Omit<UseApiControllerOptions<Record<string, any>, TResponse>, 'method'>>
): QueryResult<TResponse> => {
  return useApiController<TResponse>({
    method: "GET",
    url,
    ...options,
  } as UseApiControllerOptions<Record<string, any>, TResponse> & { method: "GET" });
};

// Generic Data Mutator with proper typing
export const useMutate = <TFormData extends Record<string, any> = Record<string, any>, TResponse = any>(
  method: Exclude<HttpMethod, "GET">,
  url: string,
  options?: Partial<Omit<UseApiControllerOptions<TFormData, TResponse>, 'method'>>
): MutationResult<TFormData, TResponse> => {
  return useApiController<TFormData, TResponse>({
    method,
    url,
    ...options,
  } as UseApiControllerOptions<TFormData, TResponse> & { method: "POST" | "PUT" | "PATCH" | "DELETE" });
};