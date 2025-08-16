import { useState } from "react";
import { useApiController } from "./useFetch";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/libs/redux/store";
import { addSuggestedUsers, setSuggestedUsersWithPagination } from "@/libs/redux/authSlice";

export const useGetUser = (userId: string) => {
  return useApiController({
    method: 'GET',
    url: `/auth/users/${userId}`,
    queryOptions: {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000,
    },
  });
};

export const useGetSuggestedUsers = (initialPage: number = 1) => {
    const [page, setPage] = useState(initialPage);
    const dispatch: AppDispatch = useDispatch();
  
 const result =  useApiController({
    method: 'GET',
    url: `/auth/suggested?page=${page}&limit=20`,
    queryOptions: {
      staleTime: 2 * 60 * 1000,
    },
    onSuccess: (data: any) => {
      if (page === 1) {
        dispatch(setSuggestedUsersWithPagination(data))
      } else {
        dispatch(addSuggestedUsers(data.users))
      }
    }
  });
  const trigger = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      setPage((prevPage) => prevPage + 1)
    }
  }
  return {...result, trigger}
};

export const useFollowUser = (userId: string, onSuccess: (data: any) => void) => {
  return useApiController({
    method: 'POST',
    url: `/follows/${userId}`,
    successMessage: 'Follow request sent',
    onSuccess: (data) => {
        onSuccess(data) 
    }
  });
};

export const useUnFollowUser = (userId: string, onSuccess: (data: any) => void) => {
  return useApiController({
    method: 'DELETE',
    url: `/follows/${userId}`,
    successMessage: 'User unfollowed',
    onSuccess: (data) => {
        onSuccess(data) 
    }
  });
};

export const useGetFollowers = (userId: string) => {
  return useApiController({
    method: 'GET',
    url: `/follows/${userId}/followers`,
    queryOptions: {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000,
    },
  });
};

export const useGetFollowing = (userId: string) => {
  return useApiController({
    method: 'GET',
    url: `/follows/${userId}/following`,
    queryOptions: {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000,
    },
  });
};

export const useGetPendingRequests = (userId: string, options: { enabled: boolean }) => {
  return useApiController({
    method: 'GET',
    url: `/follows/requests/pending`,
    queryOptions: {
      enabled: options.enabled && !!userId,
      staleTime: 2 * 60 * 1000,
    },
  });
};

export const useAcceptFollowRequest = () => {
  return useApiController({
    method: 'PUT',
    url: `/follows/requests/accept`,
    successMessage: 'Follow request accepted',
  });
};

export const useRejectFollowRequest = () => {
  return useApiController({
    method: 'PUT',
    url: `/follows/requests/reject`,
    successMessage: 'Follow request rejected',
  });
};


